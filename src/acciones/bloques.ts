'use server';

/** Escrituras sobre los bloques de una seccion. */

import {
  contenidoPorDefecto,
  esTipoBloque,
  validarContenidoBloque,
  type ContenidoAgenda,
} from '@/lib/bloques';
import { mensajeDeError } from '@/lib/errores';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import { revalidarInformes } from '@/lib/revalidacion';
import type { Bloque, ResultadoAccion } from '@/lib/tipos';

export async function agregarBloque(datos: {
  seccionId: string;
  tipo: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  if (!esTipoBloque(datos.tipo)) {
    return { exito: false, error: 'Elija un tipo de bloque válido.' };
  }

  const supabase = crearClienteDeServidor();

  const { data: ultimo } = await supabase
    .from('bloques')
    .select('orden')
    .eq('seccion_id', datos.seccionId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordenNuevo = ((ultimo as { orden: number } | null)?.orden ?? 0) + 1;

  const { data: creado, error } = await supabase
    .from('bloques')
    .insert({
      seccion_id: datos.seccionId,
      tipo: datos.tipo,
      orden: ordenNuevo,
      titulo: '',
      accion_titulo: '',
      accion_url: '',
      contenido: contenidoPorDefecto(datos.tipo),
    })
    .select('id')
    .single();

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo agregar el bloque.') };
  }

  revalidarInformes();

  return { exito: true, id: (creado as { id: string }).id, mensaje: 'Bloque agregado.' };
}

export async function guardarBloque(datos: {
  bloqueId: string;
  titulo: string;
  accionTitulo: string;
  accionUrl: string;
  contenido: unknown;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: actual } = await supabase
    .from('bloques')
    .select('tipo')
    .eq('id', datos.bloqueId)
    .maybeSingle();

  const tipo = (actual as Pick<Bloque, 'tipo'> | null)?.tipo;
  if (tipo === undefined) {
    return { exito: false, error: 'El bloque ya no existe. Recargue la pantalla.' };
  }

  const problema = validarContenidoBloque(tipo, datos.contenido);
  if (problema !== null) {
    return { exito: false, error: problema };
  }

  const accionTitulo = datos.accionTitulo.trim();
  const accionUrl = datos.accionUrl.trim();

  if (accionTitulo === '' && accionUrl !== '') {
    return { exito: false, error: 'Escriba el texto del botón, o borre la dirección si no lleva botón.' };
  }
  if (accionTitulo !== '' && accionUrl === '') {
    return { exito: false, error: 'Escriba la dirección del botón, o borre su texto si no lleva botón.' };
  }
  if (accionUrl !== '' && !/^https?:\/\//i.test(accionUrl)) {
    return { exito: false, error: 'La dirección del botón tiene que empezar con http:// o https://' };
  }

  const { error } = await supabase
    .from('bloques')
    .update({
      titulo: datos.titulo.trim(),
      accion_titulo: accionTitulo,
      accion_url: accionUrl,
      contenido: datos.contenido,
    })
    .eq('id', datos.bloqueId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el bloque.') };
  }

  revalidarInformes();

  return { exito: true, mensaje: 'Bloque guardado.' };
}

/**
 * Marca o desmarca un punto de la agenda.
 *
 * Se llama desde la vista del informe, no desde la edicion: quien presenta va
 * tildando los temas a medida que se tratan y eso queda como constancia. Solo
 * lo puede hacer quien tiene permiso de edicion; Direccion lo ve marcado.
 */
export async function alternarPuntoDeAgenda(datos: {
  bloqueId: string;
  indice: number;
  tratado: boolean;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: actual } = await supabase
    .from('bloques')
    .select('tipo, contenido')
    .eq('id', datos.bloqueId)
    .maybeSingle();

  const fila = actual as { tipo: string; contenido: ContenidoAgenda } | null;
  if (fila === null || fila.tipo !== 'agenda') {
    return { exito: false, error: 'Ese bloque ya no es una agenda. Recargue la pantalla.' };
  }

  const puntos = [...(fila.contenido.puntos ?? [])];
  const punto = puntos[datos.indice];
  if (punto === undefined) {
    return { exito: false, error: 'Ese punto de la agenda ya no existe. Recargue la pantalla.' };
  }

  puntos[datos.indice] = { ...punto, tratado: datos.tratado };
  const contenido: ContenidoAgenda = { ...fila.contenido, puntos };

  const { error } = await supabase.from('bloques').update({ contenido }).eq('id', datos.bloqueId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el estado del punto.') };
  }

  revalidarInformes();

  return { exito: true };
}

export async function moverBloque(datos: {
  bloqueId: string;
  direccion: 'arriba' | 'abajo';
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: actual } = await supabase
    .from('bloques')
    .select('id, orden, seccion_id')
    .eq('id', datos.bloqueId)
    .maybeSingle();

  const bloque = actual as Pick<Bloque, 'id' | 'orden' | 'seccion_id'> | null;
  if (bloque === null) {
    return { exito: false, error: 'El bloque ya no existe. Recargue la pantalla.' };
  }

  const comparacion = datos.direccion === 'arriba' ? 'lt' : 'gt';
  const { data: vecinoCrudo } = await supabase
    .from('bloques')
    .select('id, orden')
    .eq('seccion_id', bloque.seccion_id)
    [comparacion]('orden', bloque.orden)
    .order('orden', { ascending: datos.direccion === 'abajo' })
    .limit(1)
    .maybeSingle();

  const vecino = vecinoCrudo as { id: string; orden: number } | null;
  if (vecino === null) {
    return { exito: true, mensaje: 'El bloque ya está en el extremo.' };
  }

  const { error: errorUno } = await supabase
    .from('bloques')
    .update({ orden: vecino.orden })
    .eq('id', bloque.id);
  const { error: errorDos } = await supabase
    .from('bloques')
    .update({ orden: bloque.orden })
    .eq('id', vecino.id);

  if (errorUno !== null || errorDos !== null) {
    return {
      exito: false,
      error: mensajeDeError(errorUno ?? errorDos, 'No se pudo reordenar el bloque.'),
    };
  }

  revalidarInformes();

  return { exito: true };
}

export async function eliminarBloque(datos: { bloqueId: string }): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();
  const { error } = await supabase.from('bloques').delete().eq('id', datos.bloqueId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo eliminar el bloque.') };
  }

  revalidarInformes();

  return { exito: true, mensaje: 'Bloque eliminado.' };
}
