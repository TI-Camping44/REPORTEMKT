/**
 * Consultas de lectura.
 *
 * Las llaman componentes de servidor. Todas usan el cliente con la sesion de la
 * persona, asi que lo que devuelven ya paso por las politicas RLS: si una lista
 * viene vacia es porque esa persona no tiene permiso, no porque falte un filtro.
 */

import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type {
  Bloque,
  Empresa,
  Enlace,
  Informe,
  InformeCompleto,
  Seccion,
  SeccionCompleta,
  Tablero,
  Usuario,
} from '@/lib/tipos';

const CAMPOS_INFORME =
  'id, empresa_id, titulo, periodo_tipo, periodo_inicio, periodo_fin, periodo_etiqueta, reunion_fecha, reunion_hora, presenta, estado, creado_por, creado_en, actualizado_en';

const CAMPOS_BLOQUE =
  'id, seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido, fuente, fuente_planilla_id, fuente_rango, fuente_actualizada_en, fuente_error';

export async function listarEmpresas(): Promise<Empresa[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('empresas')
    .select('id, slug, nombre, color, orden')
    .order('orden', { ascending: true });

  return (data as Empresa[] | null) ?? [];
}

export async function obtenerEmpresaPorSlug(slug: string): Promise<Empresa | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('empresas')
    .select('id, slug, nombre, color, orden')
    .eq('slug', slug)
    .maybeSingle();

  return (data as Empresa | null) ?? null;
}

/** Informes de la empresa, del mas nuevo al mas viejo. */
export async function listarInformesDeEmpresa(empresaId: string): Promise<Informe[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(CAMPOS_INFORME)
    .eq('empresa_id', empresaId)
    .order('reunion_fecha', { ascending: false });

  return (data as Informe[] | null) ?? [];
}

/** Ultimo informe publicado de la empresa. Es el que se muestra por defecto. */
export async function obtenerUltimoInformePublicado(empresaId: string): Promise<Informe | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(CAMPOS_INFORME)
    .eq('empresa_id', empresaId)
    .eq('estado', 'publicado')
    .order('reunion_fecha', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Informe | null) ?? null;
}

/** Ultimo informe de la empresa, publicado o no. Punto de partida al duplicar. */
export async function obtenerUltimoInforme(empresaId: string): Promise<Informe | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(CAMPOS_INFORME)
    .eq('empresa_id', empresaId)
    .order('reunion_fecha', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Informe | null) ?? null;
}

export async function obtenerInforme(informeId: string): Promise<Informe | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(CAMPOS_INFORME)
    .eq('id', informeId)
    .maybeSingle();

  return (data as Informe | null) ?? null;
}

export async function listarSecciones(informeId: string): Promise<Seccion[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('secciones')
    .select('id, informe_id, clave, titulo, etiqueta, orden')
    .eq('informe_id', informeId)
    .order('orden', { ascending: true });

  return (data as Seccion[] | null) ?? [];
}

export async function listarBloquesDeSecciones(seccionIds: string[]): Promise<Bloque[]> {
  if (seccionIds.length === 0) return [];

  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('bloques')
    .select(CAMPOS_BLOQUE)
    .in('seccion_id', seccionIds)
    .order('orden', { ascending: true })
    .order('id', { ascending: true });

  return (data as Bloque[] | null) ?? [];
}

export async function listarTableros(empresaId: string, soloActivos = true): Promise<Tablero[]> {
  const supabase = crearClienteDeServidor();
  let consulta = supabase
    .from('tableros')
    .select('id, empresa_id, nombre, url_insercion, alto_px, orden, activo')
    .eq('empresa_id', empresaId);

  if (soloActivos) {
    consulta = consulta.eq('activo', true);
  }

  const { data } = await consulta.order('orden', { ascending: true });

  return (data as Tablero[] | null) ?? [];
}

export async function listarEnlaces(empresaId: string): Promise<Enlace[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('enlaces')
    .select('id, empresa_id, titulo, url, orden')
    .eq('empresa_id', empresaId)
    .order('orden', { ascending: true });

  return (data as Enlace[] | null) ?? [];
}

/**
 * El informe con todo lo que hace falta para dibujarlo.
 *
 * Son varias consultas en lugar de una anidada porque PostgREST devuelve las
 * relaciones anidadas sin garantia de orden, y aca el orden de las secciones y
 * el de los bloques es exactamente lo que define el documento.
 */
export async function obtenerInformeCompleto(informeId: string): Promise<InformeCompleto | null> {
  const informe = await obtenerInforme(informeId);
  if (informe === null) return null;

  const [secciones, empresas, tableros, enlaces] = await Promise.all([
    listarSecciones(informeId),
    listarEmpresas(),
    listarTableros(informe.empresa_id),
    listarEnlaces(informe.empresa_id),
  ]);

  const bloques = await listarBloquesDeSecciones(secciones.map((seccion) => seccion.id));

  const completas: SeccionCompleta[] = secciones.map((seccion) => ({
    ...seccion,
    bloques: bloques.filter((bloque) => bloque.seccion_id === seccion.id),
  }));

  return {
    ...informe,
    empresa: empresas.find((empresa) => empresa.id === informe.empresa_id) ?? null,
    secciones: completas,
    tableros,
    enlaces,
  };
}

/**
 * Bloques de varios informes a la vez, agrupados por informe.
 *
 * Lo usa la vista de seguimiento, que necesita recorrer todas las reuniones.
 * Son dos consultas y no una por informe: con doce reuniones, una por informe
 * serian doce viajes a la base para dibujar una sola pantalla.
 */
export async function obtenerBloquesPorInforme(
  informeIds: string[],
): Promise<Map<string, Bloque[]>> {
  const agrupados = new Map<string, Bloque[]>();
  if (informeIds.length === 0) return agrupados;

  const supabase = crearClienteDeServidor();

  const { data: seccionesCrudas } = await supabase
    .from('secciones')
    .select('id, informe_id')
    .in('informe_id', informeIds);

  const secciones = (seccionesCrudas as Array<{ id: string; informe_id: string }> | null) ?? [];
  if (secciones.length === 0) return agrupados;

  const informePorSeccion = new Map(secciones.map((seccion) => [seccion.id, seccion.informe_id]));
  const bloques = await listarBloquesDeSecciones(secciones.map((seccion) => seccion.id));

  for (const bloque of bloques) {
    const informeId = informePorSeccion.get(bloque.seccion_id);
    if (informeId === undefined) continue;

    const lista = agrupados.get(informeId) ?? [];
    lista.push(bloque);
    agrupados.set(informeId, lista);
  }

  return agrupados;
}

/** Todos los tableros, activos o no. Solo la pantalla de administracion los necesita. */
export async function listarTodosLosTableros(): Promise<Tablero[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('tableros')
    .select('id, empresa_id, nombre, url_insercion, alto_px, orden, activo')
    .order('empresa_id', { ascending: true })
    .order('orden', { ascending: true });

  return (data as Tablero[] | null) ?? [];
}

/** Todos los enlaces de todas las empresas, para la pantalla de administracion. */
export async function listarTodosLosEnlaces(): Promise<Enlace[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('enlaces')
    .select('id, empresa_id, titulo, url, orden')
    .order('empresa_id', { ascending: true })
    .order('orden', { ascending: true });

  return (data as Enlace[] | null) ?? [];
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('usuarios')
    .select('id, correo, nombre, rol, activo, creado_en')
    .order('correo', { ascending: true });

  return (data as Usuario[] | null) ?? [];
}

export async function obtenerConfiguracion(clave: string): Promise<string> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle();

  return (data as { valor: string } | null)?.valor ?? '';
}

/** Nombre de quienes crearon informes, para el encabezado. Devuelve un mapa por id. */
export async function obtenerNombresDeUsuarios(ids: string[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(ids.filter((id) => id !== '')));
  if (unicos.length === 0) return new Map();

  const supabase = crearClienteDeServidor();
  const { data } = await supabase.from('usuarios').select('id, nombre, correo').in('id', unicos);

  const mapa = new Map<string, string>();
  for (const fila of (data as Array<{ id: string; nombre: string | null; correo: string }> | null) ?? []) {
    mapa.set(fila.id, fila.nombre ?? fila.correo);
  }

  return mapa;
}
