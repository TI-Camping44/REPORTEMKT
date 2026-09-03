/**
 * Lectura de las variables de entorno.
 *
 * Se leen en un solo lugar para que, si falta una, el mensaje diga cual y donde
 * se configura, en vez de fallar mas adelante con un error sin contexto.
 */

function requerida(nombre: string, valor: string | undefined): string {
  if (valor === undefined || valor.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Agreguela a .env.local en desarrollo, o a las variables del proyecto en Vercel.`,
    );
  }
  return valor.trim();
}

/** Disponibles en el navegador. No son secretas. */
export function urlDeSupabase(): string {
  return requerida('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function clavePublicaDeSupabase(): string {
  return requerida('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Solo servidor. Nunca se expone al navegador. */
export function claveDeServicioDeSupabase(): string {
  return requerida('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Solo servidor. El dominio corporativo no se escribe en el codigo. */
export function dominioPermitido(): string {
  return requerida('DOMINIO_PERMITIDO', process.env.DOMINIO_PERMITIDO).toLowerCase();
}

/**
 * Hay credencial para leer planillas de Google.
 *
 * Se consulta desde el servidor para decidir si la edicion ofrece vincular un
 * bloque a una planilla. Sin credencial la opcion no se dibuja: una casilla que
 * al marcarse solo devuelve un error no le sirve a nadie.
 */
export function hayCredencialDePlanillas(): boolean {
  const credencial = process.env.GOOGLE_CUENTA_SERVICIO;
  return credencial !== undefined && credencial.trim() !== '';
}

/** Base publica de la aplicacion, usada para armar la URL de retorno de Google. */
export function urlDelSitio(): string {
  const declarada = process.env.NEXT_PUBLIC_SITE_URL;
  if (declarada !== undefined && declarada.trim() !== '') {
    return declarada.trim().replace(/\/$/, '');
  }

  // En Vercel la URL del despliegue esta disponible aunque no se declare la variable.
  const deVercel = process.env.VERCEL_URL;
  if (deVercel !== undefined && deVercel.trim() !== '') {
    return `https://${deVercel.trim()}`;
  }

  return 'http://localhost:3000';
}
