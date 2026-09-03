/**
 * Cliente de Supabase con la clave de servicio.
 *
 * Ignora las politicas RLS. Se usa unicamente en scripts de mantenimiento y en
 * la alta de usuarios desde la pantalla de administracion, donde hace falta
 * tocar el esquema `auth`. La clave de servicio nunca atiende una peticion de
 * la interfaz ni viaja al navegador.
 */

import { createClient } from '@supabase/supabase-js';

import { claveDeServicioDeSupabase, urlDeSupabase } from '@/lib/entorno';

export function crearClienteAdministrador() {
  return createClient(urlDeSupabase(), claveDeServicioDeSupabase(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
