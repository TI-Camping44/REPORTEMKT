'use server';

/** Alta, edicion, reordenamiento y baja de las secciones de un informe. */

import { claveDesdeTitulo } from '@/lib/secciones';
import { mensajeDeError } from '@/lib/errores';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import { revalidarInformes } from '@/lib/revalidacion';
import type { ResultadoAccion, Seccion } from '@/lib/tipos';

const CLAVE_VALIDA = /^[a-z0-9-]+$/;

export async function agregarSeccion(datos: {
  informeId: string;
  titulo: string;
  etiqueta: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const titulo = datos.titulo.trim();
  if (titulo === '') return { exito: false, error: 'Escriba el título de la sección.' };

  const clave = claveDesdeTitulo(titulo);
  if (!CLAVE_VALIDA.test(clave)) {
    return {
      exito: false,
      error: 'El título de la sección necesita al menos una letra o un número.',
    };
  }

  const supabase = crearClienteDeServidor();

  const { data: ultima } = await supabase
    .from('secciones')
    .select('orden')
    .eq('informe_id', datos.informeId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordenNuevo = ((ultima as { orden: number } | null)?.orden ?? 0) + 1;

  const { data: creada, error } = await supabase
    .from('secciones')
    .insert({
      informe_id: datos.informeId,
      clave,
      titulo,
      etiqueta: datos.etiqueta.trim(),
      orden: ordenNuevo,
    })
    .select('id')
    .single();

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo agregar la sección.') };
  }

  revalidarInformes();
  return { exito: true, id: (creada as { id: string }).id, mensaje: 'Sección agregada.' };
}

export async function guardarSeccion(datos: {
  seccionId: string;
  titulo: string;
  etiqueta: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const titulo = datos.titulo.trim();
  if (titulo === '') return { exito: false, error: 'Escriba el título de la sección.' };

  const supabase = crearClienteDeServidor();
  const { error } = await supabase
    .from('secciones')
    .update({ titulo, etiqueta: datos.etiqueta.trim() })
    .eq('id', datos.seccionId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar la sección.') };
  }

  revalidarInformes();
  return { exito: true, mensaje: 'Sección guardada.' };
}

export async function moverSeccion(datos: {
  seccionId: string;
  direccion: 'arriba' | 'abajo';
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: actual } = await supabase
    .from('secciones')
    .select('id, informe_id, orden')
    .eq('id', datos.seccionId)
    .maybeSingle();

  const seccion = actual as Pick<Seccion, 'id' | 'informe_id' | 'orden'> | null;
  if (seccion === null) {
    return { exito: false, error: 'La sección ya no existe. Recargue la pantalla.' };
  }

  const comparacion = datos.direccion === 'arriba' ? 'lt' : 'gt';
  const { data: vecinaCruda } = await supabase
    .from('secciones')
    .select('id, orden')
    .eq('informe_id', seccion.informe_id)
    [comparacion]('orden', seccion.orden)
    .order('orden', { ascending: datos.direccion === 'abajo' })
    .limit(1)
    .maybeSingle();

  const vecina = vecinaCruda as { id: string; orden: number } | null;
  if (vecina === null) {
    return { exito: true, mensaje: 'La sección ya está en el extremo.' };
  }

  const { error: errorUno } = await supabase
    .from('secciones')
    .update({ orden: vecina.orden })
    .eq('id', seccion.id);
  const { error: errorDos } = await supabase
    .from('secciones')
    .update({ orden: seccion.orden })
    .eq('id', vecina.id);

  if (errorUno !== null || errorDos !== null) {
    return {
      exito: false,
      error: mensajeDeError(errorUno ?? errorDos, 'No se pudo reordenar la sección.'),
    };
  }

  revalidarInformes();
  return { exito: true };
}

export async function eliminarSeccion(datos: { seccionId: string }): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();
  const { error } = await supabase.from('secciones').delete().eq('id', datos.seccionId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo eliminar la sección.') };
  }

  revalidarInformes();
  return { exito: true, mensaje: 'Sección eliminada con todos sus bloques.' };
}
