'use server';

/**
 * Alta, baja y cambio de rol de los usuarios.
 *
 * La baja es logica: se pone `activo` en false y las politicas RLS dejan de
 * devolverle datos. No se elimina la cuenta de auth.users desde aca porque eso
 * exigiria la clave de servicio, y la clave de servicio nunca atiende una
 * peticion de la interfaz. Si hay que borrar una cuenta por completo, se hace
 * desde el panel de Supabase.
 */

import { revalidatePath } from 'next/cache';

import { ROLES_USUARIO, type RolUsuario } from '@/lib/constantes';
import { mensajeDeError } from '@/lib/errores';
import { requerirAdministrador } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { ResultadoAccion } from '@/lib/tipos';

export async function cambiarRolDeUsuario(datos: {
  usuarioId: string;
  rol: string;
}): Promise<ResultadoAccion> {
  const sesion = await requerirAdministrador();

  if (!(ROLES_USUARIO as readonly string[]).includes(datos.rol)) {
    return { exito: false, error: 'Elija un rol válido.' };
  }

  if (datos.usuarioId === sesion.usuario.id && datos.rol !== 'administrador') {
    return {
      exito: false,
      error:
        'No puede quitarse a usted mismo el rol de administrador. Pídaselo a otro administrador para no dejar la aplicación sin nadie que la administre.',
    };
  }

  const supabase = crearClienteDeServidor();

  const { error } = await supabase
    .from('usuarios')
    .update({ rol: datos.rol as RolUsuario })
    .eq('id', datos.usuarioId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo cambiar el rol.') };
  }

  revalidatePath('/administracion');

  return { exito: true, mensaje: 'Rol actualizado.' };
}

export async function cambiarEstadoDeUsuario(datos: {
  usuarioId: string;
  activo: boolean;
}): Promise<ResultadoAccion> {
  const sesion = await requerirAdministrador();

  if (datos.usuarioId === sesion.usuario.id && !datos.activo) {
    return { exito: false, error: 'No puede darse de baja a usted mismo.' };
  }

  const supabase = crearClienteDeServidor();

  const { error } = await supabase
    .from('usuarios')
    .update({ activo: datos.activo })
    .eq('id', datos.usuarioId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo cambiar el estado del usuario.') };
  }

  revalidatePath('/administracion');

  return {
    exito: true,
    mensaje: datos.activo ? 'Usuario habilitado.' : 'Usuario dado de baja.',
  };
}
