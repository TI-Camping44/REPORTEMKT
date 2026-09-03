/**
 * Refresco de la sesion en el middleware.
 *
 * El middleware es el unico lugar donde se pueden reescribir las cookies de
 * sesion en cada peticion. Si no se hace, la sesion vence y la persona queda
 * afuera sin aviso.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { clavePublicaDeSupabase, urlDeSupabase } from '@/lib/entorno';

export function crearClienteDeMiddleware(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const cliente = createServerClient(urlDeSupabase(), clavePublicaDeSupabase(), {
    cookies: {
      getAll() {
        return peticion.cookies.getAll();
      },
      setAll(cookiesNuevas: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const { name, value } of cookiesNuevas) {
          peticion.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request: peticion });
        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  return {
    cliente,
    obtenerRespuesta: () => respuesta,
  };
}
