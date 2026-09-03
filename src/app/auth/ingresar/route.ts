/**
 * Inicio de la autenticacion con Google.
 *
 * Es una ruta de servidor y no un boton que llame a Supabase desde el
 * navegador, porque el dominio corporativo se lee de DOMINIO_PERMITIDO, que es
 * una variable sin prefijo NEXT_PUBLIC_ y por lo tanto no existe en el
 * navegador. Ademas, el parametro `hd` armado del lado del servidor no queda a
 * la vista en el codigo de la pagina.
 *
 * Primera de las tres capas de validacion del dominio: `hd` le pide a Google
 * que solo ofrezca cuentas del dominio. Se puede esquivar editando la URL, por
 * eso hacen falta las otras dos.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { dominioPermitido, urlDelSitio } from '@/lib/entorno';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';

export async function GET(peticion: NextRequest) {
  const destinoPosterior = peticion.nextUrl.searchParams.get('destino') ?? '/';
  const supabase = crearClienteDeServidor();

  const urlDeRetorno = new URL('/auth/retorno', urlDelSitio());
  urlDeRetorno.searchParams.set('destino', destinoPosterior);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: urlDeRetorno.toString(),
      queryParams: {
        hd: dominioPermitido(),
        prompt: 'select_account',
      },
    },
  });

  if (error !== null || data.url === null) {
    const destino = new URL('/ingresar', urlDelSitio());
    destino.searchParams.set(
      'error',
      'No se pudo contactar con Google. Intente de nuevo en unos minutos.',
    );
    return NextResponse.redirect(destino);
  }

  return NextResponse.redirect(data.url);
}
