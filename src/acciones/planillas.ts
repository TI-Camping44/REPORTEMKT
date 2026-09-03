'use server';

/** Vinculacion de bloques a una planilla de Google y actualizacion de su contenido. */

import { validarContenidoBloque } from '@/lib/bloques';
import { convertirDesdePlanilla, esTipoVinculable } from '@/lib/desde-planilla';
import { mensajeDeError } from '@/lib/errores';
import { ErrorDePlanilla, identificadorDePlanilla, leerRango } from '@/lib/planillas';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import { revalidarInformes } from '@/lib/revalidacion';
import type { Bloque, ResultadoAccion } from '@/lib/tipos';

type BloqueConInforme = Pick<
  Bloque,
  'id' | 'tipo' | 'contenido' | 'fuente' | 'fuente_planilla_id' | 'fuente_rango'
> & {
  secciones: { informes: { id: string; estado: string } | null } | null;
};

const SELECCION = 'id, tipo, contenido, fuente, fuente_planilla_id, fuente_rango, secciones ( informes ( id, estado ) )';

export async function guardarFuenteDelBloque(datos: {
  bloqueId: string;
  vinculado: boolean;
  planilla: string;
  rango: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data } = await supabase.from('bloques').select('tipo').eq('id', datos.bloqueId).maybeSingle();
  const tipo = (data as Pick<Bloque, 'tipo'> | null)?.tipo;

  if (tipo === undefined) {
    return { exito: false, error: 'El bloque ya no existe. Recargue la pantalla.' };
  }

  if (!datos.vinculado) {
    const { error } = await supabase
      .from('bloques')
      .update({
        fuente: 'manual',
        fuente_planilla_id: '',
        fuente_rango: '',
        fuente_error: '',
      })
      .eq('id', datos.bloqueId);

    if (error !== null) {
      return { exito: false, error: mensajeDeError(error, 'No se pudo desvincular el bloque.') };
    }

    revalidarInformes();
    return { exito: true, mensaje: 'El bloque volvió a carga manual. El contenido que tenía se conserva.' };
  }

  if (!esTipoVinculable(tipo)) {
    return {
      exito: false,
      error: 'Solo los bloques de tabla y de indicadores se pueden vincular a una planilla.',
    };
  }

  const planilla = identificadorDePlanilla(datos.planilla);
  const rango = datos.rango.trim();

  if (planilla === '') return { exito: false, error: 'Pegue la dirección de la planilla.' };
  if (rango === '') {
    return { exito: false, error: 'Escriba el rango, con el nombre de la pestaña. Por ejemplo: Pautas!A1:E30' };
  }

  const { error } = await supabase
    .from('bloques')
    .update({
      fuente: 'planilla',
      fuente_planilla_id: planilla,
      fuente_rango: rango,
      fuente_error: '',
    })
    .eq('id', datos.bloqueId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo vincular el bloque.') };
  }

  revalidarInformes();
  return { exito: true, mensaje: 'Bloque vinculado. Actualícelo para traer los datos.' };
}

/**
 * Trae el contenido del bloque desde su planilla.
 *
 * Un informe publicado no se actualiza: es el registro de lo que se dijo en esa
 * reunion. Para corregirlo hay que devolverlo a borrador, que es una decision
 * explicita y queda a la vista de Direccion.
 */
export async function actualizarBloqueDesdePlanilla(datos: {
  bloqueId: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();
  const { data } = await supabase.from('bloques').select(SELECCION).eq('id', datos.bloqueId).maybeSingle();

  const bloque = data as BloqueConInforme | null;
  if (bloque === null) {
    return { exito: false, error: 'El bloque ya no existe. Recargue la pantalla.' };
  }

  if (bloque.fuente !== 'planilla') {
    return { exito: false, error: 'Este bloque no está vinculado a ninguna planilla.' };
  }

  if (bloque.secciones?.informes?.estado === 'publicado') {
    return {
      exito: false,
      error:
        'El informe está publicado y no se actualiza: es el registro de lo que se presentó. Devuélvalo a borrador si necesita corregirlo.',
    };
  }

  const resultado = await traerContenido(bloque);

  if (!resultado.exito) {
    await supabase
      .from('bloques')
      .update({ fuente_error: resultado.error })
      .eq('id', bloque.id);
    revalidarInformes();
    return resultado;
  }

  revalidarInformes();
  return { exito: true, mensaje: 'Contenido actualizado desde la planilla.' };
}

/** Actualiza todos los bloques vinculados de un informe en borrador. */
export async function actualizarInformeDesdePlanillas(datos: {
  informeId: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: informe } = await supabase
    .from('informes')
    .select('estado')
    .eq('id', datos.informeId)
    .maybeSingle();

  if ((informe as { estado: string } | null)?.estado === 'publicado') {
    return {
      exito: false,
      error:
        'El informe está publicado y no se actualiza. Devuélvalo a borrador si necesita traer datos nuevos.',
    };
  }

  const { data: secciones } = await supabase
    .from('secciones')
    .select('id')
    .eq('informe_id', datos.informeId);

  const ids = ((secciones as Array<{ id: string }> | null) ?? []).map((seccion) => seccion.id);
  if (ids.length === 0) return { exito: true, mensaje: 'El informe no tiene secciones.' };

  const { data: bloques } = await supabase
    .from('bloques')
    .select(SELECCION)
    .in('seccion_id', ids)
    .eq('fuente', 'planilla');

  const vinculados = (bloques as BloqueConInforme[] | null) ?? [];
  if (vinculados.length === 0) {
    return { exito: true, mensaje: 'Este informe no tiene bloques vinculados a una planilla.' };
  }

  let correctos = 0;
  const fallos: string[] = [];

  for (const bloque of vinculados) {
    const resultado = await traerContenido(bloque);
    if (resultado.exito) {
      correctos += 1;
    } else {
      fallos.push(resultado.error);
      await supabase.from('bloques').update({ fuente_error: resultado.error }).eq('id', bloque.id);
    }
  }

  revalidarInformes();

  if (fallos.length === 0) {
    return {
      exito: true,
      mensaje: `Se actualizaron ${correctos} bloque${correctos === 1 ? '' : 's'} desde sus planillas.`,
    };
  }

  return {
    exito: false,
    error: `Se actualizaron ${correctos} de ${vinculados.length}. ${fallos[0] ?? ''}`,
  };
}

/**
 * Lee la planilla, convierte y guarda. No decide sobre permisos ni sobre el
 * estado del informe: eso lo resuelve quien la llama.
 */
async function traerContenido(bloque: BloqueConInforme): Promise<ResultadoAccion> {
  const supabase = crearClienteDeServidor();

  let filas: string[][];
  try {
    filas = await leerRango(bloque.fuente_planilla_id, bloque.fuente_rango);
  } catch (error) {
    if (error instanceof ErrorDePlanilla) {
      return { exito: false, error: error.message };
    }
    return {
      exito: false,
      error: 'No se pudo contactar con Google para leer la planilla. Vuelva a intentarlo en unos minutos.',
    };
  }

  const conversion = convertirDesdePlanilla(bloque.tipo, filas, bloque.contenido);
  if (!conversion.exito) {
    return { exito: false, error: conversion.error };
  }

  const problema = validarContenidoBloque(bloque.tipo, conversion.contenido);
  if (problema !== null) {
    return { exito: false, error: `La planilla trajo datos que el bloque no admite: ${problema}` };
  }

  const { error } = await supabase
    .from('bloques')
    .update({
      contenido: conversion.contenido,
      fuente_actualizada_en: new Date().toISOString(),
      fuente_error: '',
    })
    .eq('id', bloque.id);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el contenido leído.') };
  }

  return { exito: true };
}
