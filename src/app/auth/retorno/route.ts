/**
 * Retorno de la autenticacion con Google.
 *
 * Segunda capa de validacion del dominio, del lado del servidor: aca ya se
 * conoce el correo real de la cuenta, sin depender de lo que Google haya
 * mostrado en su pantalla. Si no pertenece al dominio se cierra la sesion antes
 * de dejar entrar a ninguna pantalla.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { dominioPermitido, urlDelSitio } from '@/lib/entorno';
import { correoPerteneceAlDominio } from '@/lib/permisos';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';

function haciaIngreso(mensaje: string) {
  const destino = new URL('/ingresar', urlDelSitio());
  destino.searchParams.set('error', mensaje);
  return NextResponse.redirect(destino);
}

export async function GET(peticion: NextRequest) {
  const parametros = peticion.nextUrl.searchParams;
  const codigo = parametros.get('code');
  const errorDeGoogle = parametros.get('error_description') ?? parametros.get('error');

  if (errorDeGoogle !== null) {
    return haciaIngreso('Google rechazó el ingreso. Verifique que use su cuenta corporativa.');
  }

  if (codigo === null) {
    return haciaIngreso('El enlace de ingreso no es válido. Vuelva a intentarlo.');
  }

  const supabase = crearClienteDeServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error !== null || data.user === null) {
    return haciaIngreso('No se pudo completar el ingreso. Vuelva a intentarlo.');
  }

  const correo = data.user.email ?? '';

  if (!correoPerteneceAlDominio(correo, dominioPermitido())) {
    await supabase.auth.signOut();
    const destino = new URL('/sin-acceso', urlDelSitio());
    destino.searchParams.set('motivo', 'dominio');
    return NextResponse.redirect(destino);
  }

  const destinoPosterior = parametros.get('destino') ?? '/';
  // Solo se admiten rutas internas: un destino absoluto podria llevar la sesion
  // recien abierta a un sitio ajeno.
  const rutaSegura = destinoPosterior.startsWith('/') && !destinoPosterior.startsWith('//')
    ? destinoPosterior
    : '/';

  return NextResponse.redirect(new URL(rutaSegura, urlDelSitio()));
}
