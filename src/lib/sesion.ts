/**
 * Resolucion de la sesion del lado del servidor.
 *
 * Toda pantalla protegida pasa por aca. Devuelve la cuenta de Google y el
 * perfil de la aplicacion, que son dos cosas distintas: puede haber cuenta sin
 * perfil habilitado.
 */

import { redirect } from 'next/navigation';

import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { Usuario } from '@/lib/tipos';

export type Sesion = {
  correo: string;
  usuario: Usuario | null;
};

/** Devuelve la sesion, o null si no hay ninguna. No redirige. */
export async function obtenerSesion(): Promise<Sesion | null> {
  const supabase = crearClienteDeServidor();

  const {
    data: { user: cuenta },
  } = await supabase.auth.getUser();

  if (cuenta === null || cuenta.email === undefined || cuenta.email === null) {
    return null;
  }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, correo, nombre, rol, activo, creado_en')
    .eq('id', cuenta.id)
    .maybeSingle();

  return {
    correo: cuenta.email,
    usuario: (perfil as Usuario | null) ?? null,
  };
}

/**
 * Exige una sesion con perfil habilitado.
 *
 * Sin sesion manda a la pantalla de ingreso; con la cuenta dada de baja, a la
 * de acceso denegado, que explica a quien pedir el alta.
 */
export async function requerirUsuario(): Promise<{ correo: string; usuario: Usuario }> {
  const sesion = await obtenerSesion();

  if (sesion === null) {
    redirect('/ingresar');
  }

  if (sesion.usuario === null) {
    redirect('/sin-acceso?motivo=sin-perfil');
  }

  if (!sesion.usuario.activo) {
    redirect('/sin-acceso?motivo=inactivo');
  }

  return { correo: sesion.correo, usuario: sesion.usuario };
}

/** Exige rol de editor o administrador. */
export async function requerirEditor(): Promise<{ correo: string; usuario: Usuario }> {
  const sesion = await requerirUsuario();

  if (sesion.usuario.rol === 'lector') {
    redirect('/sin-acceso?motivo=solo-lectura');
  }

  return sesion;
}

/** Exige rol de administrador. */
export async function requerirAdministrador(): Promise<{ correo: string; usuario: Usuario }> {
  const sesion = await requerirUsuario();

  if (sesion.usuario.rol !== 'administrador') {
    redirect('/sin-acceso?motivo=solo-administracion');
  }

  return sesion;
}
