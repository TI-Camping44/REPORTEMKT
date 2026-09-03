'use server';

/** Alta, edicion y publicacion de informes. */

import { redirect } from 'next/navigation';

import { SECCIONES_POR_DEFECTO } from '@/lib/secciones';
import { mensajeDeError } from '@/lib/errores';
import { esFechaValida } from '@/lib/periodos';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import { revalidarInformes } from '@/lib/revalidacion';
import { TIPOS_PERIODO } from '@/lib/constantes';
import type { Bloque, ResultadoAccion, Seccion } from '@/lib/tipos';

type DatosDeEncabezado = {
  titulo: string;
  periodoTipo: string;
  periodoInicio: string;
  periodoFin: string;
  periodoEtiqueta: string;
  reunionFecha: string;
  reunionHora: string;
  presenta: string;
};

/**
 * Valida el encabezado antes de escribir.
 *
 * La base tiene sus restricciones CHECK, pero el error de PostgreSQL no le dice
 * a nadie que corregir. Estos mensajes si.
 */
function validarEncabezado(datos: DatosDeEncabezado): string | null {
  if (datos.titulo.trim() === '') return 'Escriba el título del informe.';
  if (!(TIPOS_PERIODO as readonly string[]).includes(datos.periodoTipo)) {
    return 'Elija si el período es quincenal o mensual.';
  }
  if (!esFechaValida(datos.periodoInicio)) return 'La fecha de inicio del período no es válida.';
  if (!esFechaValida(datos.periodoFin)) return 'La fecha de fin del período no es válida.';
  if (datos.periodoFin < datos.periodoInicio) {
    return 'La fecha de fin del período no puede ser anterior a la de inicio.';
  }
  if (!esFechaValida(datos.reunionFecha)) return 'Indique la fecha de la reunión.';
  if (datos.periodoEtiqueta.trim() === '') {
    return 'Escriba el período tal como se presenta, por ejemplo «julio 2026 + avances al 14/08».';
  }
  return null;
}

export async function crearInforme(datos: DatosDeEncabezado & {
  empresaId: string;
  /** Informe del que se copian secciones y bloques. Vacio: se arranca con las secciones por defecto. */
  duplicarDe?: string;
}): Promise<ResultadoAccion> {
  const { usuario } = await requerirEditor();

  const problema = validarEncabezado(datos);
  if (problema !== null) return { exito: false, error: problema };

  const supabase = crearClienteDeServidor();

  const { data: creado, error } = await supabase
    .from('informes')
    .insert({
      empresa_id: datos.empresaId,
      titulo: datos.titulo.trim(),
      periodo_tipo: datos.periodoTipo,
      periodo_inicio: datos.periodoInicio,
      periodo_fin: datos.periodoFin,
      periodo_etiqueta: datos.periodoEtiqueta.trim(),
      reunion_fecha: datos.reunionFecha,
      reunion_hora: datos.reunionHora.trim(),
      presenta: datos.presenta.trim(),
      estado: 'borrador',
      creado_por: usuario.id,
    })
    .select('id')
    .single();

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo crear el informe.') };
  }

  const informeId = (creado as { id: string }).id;

  const copiado =
    datos.duplicarDe !== undefined && datos.duplicarDe !== ''
      ? await copiarContenido(datos.duplicarDe, informeId)
      : await crearSeccionesPorDefecto(informeId);

  if (copiado !== null) {
    return { exito: false, error: copiado };
  }

  revalidarInformes();
  return { exito: true, id: informeId, mensaje: 'Informe creado.' };
}

/** Secciones iniciales de un informe que no duplica a ninguno. */
async function crearSeccionesPorDefecto(informeId: string): Promise<string | null> {
  const supabase = crearClienteDeServidor();

  const filas = SECCIONES_POR_DEFECTO.map((seccion, indice) => ({
    informe_id: informeId,
    clave: seccion.clave,
    titulo: seccion.titulo,
    etiqueta: seccion.etiqueta,
    orden: indice + 1,
  }));

  const { error } = await supabase.from('secciones').insert(filas);
  if (error !== null) {
    return mensajeDeError(error, 'El informe se creó, pero no se pudieron crear sus secciones.');
  }

  return null;
}

/**
 * Copia secciones y bloques de un informe a otro.
 *
 * Duplicar importa mas de lo que parece: entre una reunion y la siguiente
 * cambia una parte del contenido, no todo. Si hubiera que escribir el informe
 * entero cada vez, en dos meses se vuelve al PDF.
 */
async function copiarContenido(origenId: string, destinoId: string): Promise<string | null> {
  const supabase = crearClienteDeServidor();

  const { data: seccionesCrudas } = await supabase
    .from('secciones')
    .select('id, informe_id, clave, titulo, etiqueta, orden')
    .eq('informe_id', origenId)
    .order('orden', { ascending: true });

  const secciones = (seccionesCrudas as Seccion[] | null) ?? [];
  if (secciones.length === 0) {
    return crearSeccionesPorDefecto(destinoId);
  }

  const { data: creadasCrudas, error: errorSecciones } = await supabase
    .from('secciones')
    .insert(
      secciones.map((seccion) => ({
        informe_id: destinoId,
        clave: seccion.clave,
        titulo: seccion.titulo,
        etiqueta: seccion.etiqueta,
        orden: seccion.orden,
      })),
    )
    .select('id, clave');

  if (errorSecciones !== null) {
    return mensajeDeError(errorSecciones, 'El informe se creó, pero no se pudieron copiar sus secciones.');
  }

  const nuevaPorClave = new Map(
    ((creadasCrudas as Array<{ id: string; clave: string }> | null) ?? []).map((fila) => [
      fila.clave,
      fila.id,
    ]),
  );
  const claveOriginal = new Map(secciones.map((seccion) => [seccion.id, seccion.clave]));

  const { data: bloquesCrudos } = await supabase
    .from('bloques')
    .select('id, seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido')
    .in('seccion_id', secciones.map((seccion) => seccion.id))
    .order('orden', { ascending: true });

  const bloques = (bloquesCrudos as Bloque[] | null) ?? [];
  if (bloques.length === 0) return null;

  const filas = bloques.flatMap((bloque) => {
    const clave = claveOriginal.get(bloque.seccion_id);
    const seccionNueva = clave === undefined ? undefined : nuevaPorClave.get(clave);
    if (seccionNueva === undefined) return [];

    return [
      {
        seccion_id: seccionNueva,
        tipo: bloque.tipo,
        orden: bloque.orden,
        titulo: bloque.titulo,
        accion_titulo: bloque.accion_titulo,
        accion_url: bloque.accion_url,
        // La agenda arranca sin tildar: los temas del período anterior ya se trataron.
        contenido: bloque.tipo === 'agenda' ? destildarAgenda(bloque.contenido) : bloque.contenido,
      },
    ];
  });

  const { error } = await supabase.from('bloques').insert(filas);
  if (error !== null) {
    return mensajeDeError(error, 'Las secciones se copiaron, pero no sus bloques.');
  }

  return null;
}

function destildarAgenda(contenido: unknown): unknown {
  if (typeof contenido !== 'object' || contenido === null) return contenido;
  const agenda = contenido as { puntos?: Array<Record<string, unknown>> };
  if (!Array.isArray(agenda.puntos)) return contenido;

  return { ...agenda, puntos: agenda.puntos.map((punto) => ({ ...punto, tratado: false })) };
}

export async function guardarEncabezado(
  datos: DatosDeEncabezado & { informeId: string },
): Promise<ResultadoAccion> {
  await requerirEditor();

  const problema = validarEncabezado(datos);
  if (problema !== null) return { exito: false, error: problema };

  const supabase = crearClienteDeServidor();
  const { error } = await supabase
    .from('informes')
    .update({
      titulo: datos.titulo.trim(),
      periodo_tipo: datos.periodoTipo,
      periodo_inicio: datos.periodoInicio,
      periodo_fin: datos.periodoFin,
      periodo_etiqueta: datos.periodoEtiqueta.trim(),
      reunion_fecha: datos.reunionFecha,
      reunion_hora: datos.reunionHora.trim(),
      presenta: datos.presenta.trim(),
    })
    .eq('id', datos.informeId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el encabezado.') };
  }

  revalidarInformes();
  return { exito: true, mensaje: 'Encabezado guardado.' };
}

export async function cambiarEstadoDelInforme(datos: {
  informeId: string;
  estado: 'borrador' | 'publicado';
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();
  const { error } = await supabase
    .from('informes')
    .update({ estado: datos.estado })
    .eq('id', datos.informeId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo cambiar el estado del informe.') };
  }

  revalidarInformes();
  return {
    exito: true,
    mensaje: datos.estado === 'publicado' ? 'Informe publicado.' : 'El informe volvió a borrador.',
  };
}

export async function eliminarInforme(datos: {
  informeId: string;
  /** Slug de la empresa, para volver a su historial despues de borrar. */
  slugEmpresa: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();
  const { error } = await supabase.from('informes').delete().eq('id', datos.informeId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo eliminar el informe.') };
  }

  revalidarInformes();
  redirect(`/${datos.slugEmpresa}/historial`);
}
