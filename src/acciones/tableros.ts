'use server';

/** Configuracion de los tableros de Looker Studio. */

import { revalidatePath } from 'next/cache';

import { ALTO_TABLERO_POR_DEFECTO } from '@/lib/constantes';
import { mensajeDeError } from '@/lib/errores';
import { requerirAdministrador } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { ResultadoAccion } from '@/lib/tipos';

export async function guardarTablero(datos: {
  tableroId: string;
  nombre: string;
  urlInsercion: string;
  altoPx: number;
  activo: boolean;
}): Promise<ResultadoAccion> {
  await requerirAdministrador();

  const nombre = datos.nombre.trim();
  if (nombre === '') {
    return { exito: false, error: 'El tablero necesita un nombre.' };
  }

  const url = datos.urlInsercion.trim();
  if (url !== '' && !url.startsWith('https://')) {
    return {
      exito: false,
      error:
        'La dirección de inserción tiene que empezar con https://. Cópiela de Looker Studio, en Archivo → Insertar informe.',
    };
  }

  if (url !== '' && !url.includes('lookerstudio.google.com') && !url.includes('datastudio.google.com')) {
    return {
      exito: false,
      error: 'La dirección no parece ser de Looker Studio. Verifique que la copió de la opción de inserción.',
    };
  }

  const alto = Number.isFinite(datos.altoPx) ? Math.round(datos.altoPx) : ALTO_TABLERO_POR_DEFECTO;
  if (alto < 300 || alto > 6000) {
    return { exito: false, error: 'El alto del tablero debe estar entre 300 y 6000 píxeles.' };
  }

  const supabase = crearClienteDeServidor();

  const { error } = await supabase
    .from('tableros')
    .update({ nombre, url_insercion: url, alto_px: alto, activo: datos.activo })
    .eq('id', datos.tableroId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el tablero.') };
  }

  revalidatePath('/administracion');
  revalidatePath('/', 'layout');

  return { exito: true, mensaje: 'Tablero guardado.' };
}
