/**
 * Cliente de Supabase para el servidor.
 *
 * Opera con la sesion de la persona que hizo la peticion, asi que las politicas
 * RLS se aplican con normalidad. Es el cliente que usan los componentes de
 * servidor, las acciones de servidor y las rutas de la API.
 */

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { clavePublicaDeSupabase, urlDeSupabase } from '@/lib/entorno';

export function crearClienteDeServidor() {
  const almacenDeCookies = cookies();

  return createServerClient(urlDeSupabase(), clavePublicaDeSupabase(), {
    cookies: {
      getAll() {
        return almacenDeCookies.getAll();
      },
      setAll(cookiesNuevas: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacenDeCookies.set(name, value, options);
          }
        } catch {
          // Un componente de servidor no puede escribir cookies. El refresco de
          // la sesion ya lo hace el middleware, asi que aca se puede ignorar.
        }
      },
    },
  });
}
