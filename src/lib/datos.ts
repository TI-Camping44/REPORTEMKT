/**
 * Consultas de lectura.
 *
 * Las llaman componentes de servidor. Todas usan el cliente con la sesion de la
 * persona, asi que lo que devuelven ya paso por las politicas RLS: si una lista
 * viene vacia es porque esa persona no tiene permiso, no porque falte un filtro.
 */

import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { Bloque, Empresa, Enlace, Informe, Tablero, Usuario } from '@/lib/tipos';

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

export async function listarInformesDeEmpresa(empresaId: string): Promise<Informe[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(
      'id, empresa_id, periodo_tipo, periodo_inicio, periodo_fin, estado, creado_por, creado_en, actualizado_en',
    )
    .eq('empresa_id', empresaId)
    .order('periodo_inicio', { ascending: false })
    .order('periodo_tipo', { ascending: true });

  return (data as Informe[] | null) ?? [];
}

/** Ultimo informe publicado de la empresa. Es el que se muestra por defecto. */
export async function obtenerUltimoInformePublicado(empresaId: string): Promise<Informe | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(
      'id, empresa_id, periodo_tipo, periodo_inicio, periodo_fin, estado, creado_por, creado_en, actualizado_en',
    )
    .eq('empresa_id', empresaId)
    .eq('estado', 'publicado')
    .order('periodo_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Informe | null) ?? null;
}

/** Ultimo informe de la empresa, publicado o no. Sirve de punto de partida al duplicar. */
export async function obtenerUltimoInforme(empresaId: string): Promise<Informe | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(
      'id, empresa_id, periodo_tipo, periodo_inicio, periodo_fin, estado, creado_por, creado_en, actualizado_en',
    )
    .eq('empresa_id', empresaId)
    .order('periodo_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Informe | null) ?? null;
}

export async function obtenerInforme(informeId: string): Promise<Informe | null> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select(
      'id, empresa_id, periodo_tipo, periodo_inicio, periodo_fin, estado, creado_por, creado_en, actualizado_en',
    )
    .eq('id', informeId)
    .maybeSingle();

  return (data as Informe | null) ?? null;
}

export async function listarBloques(informeId: string): Promise<Bloque[]> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('bloques')
    .select('id, informe_id, tipo, orden, titulo, contenido')
    .eq('informe_id', informeId)
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

/** Todos los tableros, activos o no, para la pantalla de administracion. */
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
