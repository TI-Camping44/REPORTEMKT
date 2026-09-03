/**
 * Middleware: refresco de sesion y primera barrera del dominio corporativo.
 *
 * Es la segunda de las tres capas de validacion del dominio. Cubre el trafico
 * normal del navegador, pero no reemplaza al disparador de la base: alguien que
 * llame a la API de Supabase sin pasar por aca no lo atraviesa.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { crearClienteDeMiddleware } from '@/lib/supabase/middleware';
import { correoPerteneceAlDominio } from '@/lib/permisos';

/** Rutas que se pueden ver sin sesion. */
const RUTAS_PUBLICAS = ['/ingresar', '/sin-acceso', '/auth'];

function esRutaPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.some((publica) => ruta === publica || ruta.startsWith(`${publica}/`));
}

export async function middleware(peticion: NextRequest) {
  const { cliente, obtenerRespuesta } = crearClienteDeMiddleware(peticion);

  // getUser valida el token contra Supabase y, de paso, renueva la cookie.
  const {
    data: { user: cuenta },
  } = await cliente.auth.getUser();

  const ruta = peticion.nextUrl.pathname;

  if (cuenta === null) {
    if (esRutaPublica(ruta)) {
      return obtenerRespuesta();
    }

    const destino = peticion.nextUrl.clone();
    destino.pathname = '/ingresar';
    destino.search = '';
    return NextResponse.redirect(destino);
  }

  const dominio = process.env.DOMINIO_PERMITIDO ?? '';
  const correo = cuenta.email ?? '';

  if (!correoPerteneceAlDominio(correo, dominio)) {
    await cliente.auth.signOut();

    const destino = peticion.nextUrl.clone();
    destino.pathname = '/sin-acceso';
    destino.search = '?motivo=dominio';
    return NextResponse.redirect(destino);
  }

  // Con sesion valida, la pantalla de ingreso no tiene sentido.
  if (ruta === '/ingresar') {
    const destino = peticion.nextUrl.clone();
    destino.pathname = '/';
    destino.search = '';
    return NextResponse.redirect(destino);
  }

  return obtenerRespuesta();
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos los archivos estaticos y las imagenes optimizadas.
     *
     * La ruta de retorno de la autenticacion queda incluida a proposito: ahi el
     * middleware refresca la cookie antes de que la ruta intercambie el codigo.
     *
     * /api queda afuera: sus rutas no las abre una persona con sesion, las
     * llama la tarea programada de Vercel y validan su propio secreto. Si
     * pasaran por aca, el middleware las mandaria a la pantalla de ingreso.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
