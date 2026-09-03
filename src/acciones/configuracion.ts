'use server';

/** Ajustes guardados en la base. Hoy: el dominio corporativo autorizado. */

import { revalidatePath } from 'next/cache';

import { CLAVE_DOMINIO_PERMITIDO } from '@/lib/constantes';
import { mensajeDeError } from '@/lib/errores';
import { requerirAdministrador } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { ResultadoAccion } from '@/lib/tipos';

export async function guardarDominioPermitido(dominio: string): Promise<ResultadoAccion> {
  await requerirAdministrador();

  const valor = dominio.trim().toLowerCase();

  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(valor)) {
    return {
      exito: false,
      error: 'Escriba solo el dominio, sin arroba ni espacios. Por ejemplo: empresa.com.py',
    };
  }

  const supabase = crearClienteDeServidor();

  const { error } = await supabase
    .from('configuracion')
    .update({ valor })
    .eq('clave', CLAVE_DOMINIO_PERMITIDO);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el dominio.') };
  }

  revalidatePath('/administracion');

  return {
    exito: true,
    mensaje:
      'Dominio guardado. Recuerde que la variable DOMINIO_PERMITIDO de la aplicación tiene que tener el mismo valor.',
  };
}
