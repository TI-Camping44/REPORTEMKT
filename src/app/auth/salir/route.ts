/** Cierre de sesion. Va por POST para que no lo dispare un enlace visitado por error. */

import { NextResponse } from 'next/server';

import { urlDelSitio } from '@/lib/entorno';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';

export async function POST() {
  const supabase = crearClienteDeServidor();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/ingresar', urlDelSitio()), { status: 303 });
}
