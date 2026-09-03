/**
 * Cliente de Supabase para el navegador.
 *
 * Solo se usa para cerrar sesion y para escuchar cambios de autenticacion.
 * Los datos los consultan los componentes de servidor: un componente de cliente
 * no consulta tablas.
 */

import { createBrowserClient } from '@supabase/ssr';

import { clavePublicaDeSupabase, urlDeSupabase } from '@/lib/entorno';

export function crearClienteDeNavegador() {
  return createBrowserClient(urlDeSupabase(), clavePublicaDeSupabase());
}
