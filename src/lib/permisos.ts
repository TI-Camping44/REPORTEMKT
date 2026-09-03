/**
 * Reglas de permisos compartidas entre servidor y cliente.
 *
 * Son sincronas y no consultan la base: sirven para decidir que se dibuja.
 * El control de acceso real vive en las politicas RLS de PostgreSQL. Ocultar
 * un boton no es un control de acceso.
 */

import type { RolUsuario } from '@/lib/constantes';

export function esAdministrador(rol: RolUsuario | null | undefined): boolean {
  return rol === 'administrador';
}

export function puedeEditar(rol: RolUsuario | null | undefined): boolean {
  return rol === 'administrador' || rol === 'editor';
}

/** Normaliza un correo para compararlo contra el dominio permitido. */
export function dominioDelCorreo(correo: string): string {
  const partes = correo.trim().toLowerCase().split('@');
  return partes.length === 2 ? (partes[1] ?? '') : '';
}

export function correoPerteneceAlDominio(correo: string, dominio: string): boolean {
  const dominioNormalizado = dominio.trim().toLowerCase();
  if (dominioNormalizado === '') return false;
  return dominioDelCorreo(correo) === dominioNormalizado;
}
