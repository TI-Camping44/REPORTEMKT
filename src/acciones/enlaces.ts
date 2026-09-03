'use server';

/** Enlaces utiles de cada empresa: planilla de pautas, control presupuestario, NPS. */

import { revalidatePath } from 'next/cache';

import { mensajeDeError } from '@/lib/errores';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { ResultadoAccion } from '@/lib/tipos';

function validarEnlace(titulo: string, url: string): string | null {
  if (titulo.trim() === '') return 'El enlace necesita un título.';
  if (!/^https?:\/\//i.test(url.trim())) {
    return 'La dirección tiene que empezar con http:// o https://';
  }
  return null;
}

export async function agregarEnlace(datos: {
  empresaId: string;
  titulo: string;
  url: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const problema = validarEnlace(datos.titulo, datos.url);
  if (problema !== null) return { exito: false, error: problema };

  const supabase = crearClienteDeServidor();

  const { data: ultimo } = await supabase
    .from('enlaces')
    .select('orden')
    .eq('empresa_id', datos.empresaId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('enlaces').insert({
    empresa_id: datos.empresaId,
    titulo: datos.titulo.trim(),
    url: datos.url.trim(),
    orden: ((ultimo as { orden: number } | null)?.orden ?? 0) + 1,
  });

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo agregar el enlace.') };
  }

  revalidatePath('/administracion');
  revalidatePath('/', 'layout');

  return { exito: true, mensaje: 'Enlace agregado.' };
}

export async function eliminarEnlace(enlaceId: string): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();
  const { error } = await supabase.from('enlaces').delete().eq('id', enlaceId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo eliminar el enlace.') };
  }

  revalidatePath('/administracion');
  revalidatePath('/', 'layout');

  return { exito: true, mensaje: 'Enlace eliminado.' };
}
