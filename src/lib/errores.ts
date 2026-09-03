/**
 * Traduccion de los errores de PostgreSQL a mensajes para la persona.
 *
 * El error crudo de PostgreSQL no se muestra nunca: dice cosas como
 * «duplicate key value violates unique constraint "informes_periodo_unico"»,
 * que no le indica a nadie que tiene que hacer.
 */

type ErrorDeSupabase = {
  code?: string;
  message?: string;
  details?: string | null;
};

const POR_RESTRICCION: Record<string, string> = {
  informes_reunion_unica:
    'Ya existe un informe de esa empresa para esa reunión. Abra el que ya está cargado en lugar de crear otro.',
  secciones_clave_unica:
    'Ya hay una sección con ese título en este informe. Use otro título.',
  secciones_clave_en_minusculas:
    'El título de la sección necesita al menos una letra o un número.',
  bloques_accion_url_absoluta:
    'La dirección del botón del bloque tiene que empezar con http:// o https://',
  bloques_accion_completa:
    'El botón del bloque necesita texto y dirección: complete los dos, o borre los dos.',
  informes_periodo_coherente: 'La fecha de fin del período no puede ser anterior a la de inicio.',
  tableros_url_vacia_o_segura:
    'La dirección de inserción tiene que empezar con https:// o quedar vacía si el tablero todavía no existe.',
  tableros_alto_razonable: 'El alto del tablero debe estar entre 300 y 6000 píxeles.',
  enlaces_url_absoluta: 'La dirección del enlace tiene que empezar con http:// o https://',
  usuarios_correo_unico: 'Ya existe un usuario con ese correo.',
  empresas_slug_en_minusculas:
    'El identificador de la empresa solo admite minúsculas, números y guiones.',
  empresas_color_hexadecimal: 'El color debe escribirse en hexadecimal, por ejemplo #E01E37.',
};

export function mensajeDeError(error: unknown, respaldo: string): string {
  if (typeof error !== 'object' || error === null) return respaldo;

  const { code, message } = error as ErrorDeSupabase;
  const texto = message ?? '';

  for (const [restriccion, mensaje] of Object.entries(POR_RESTRICCION)) {
    if (texto.includes(restriccion)) return mensaje;
  }

  switch (code) {
    case '23505':
      return 'Ese registro ya existe. Revise si no está cargado.';
    case '23514':
      return 'Alguno de los datos no cumple las reglas de la base. Revise las fechas y las direcciones.';
    case '23503':
      return 'El registro está relacionado con otro que no existe o que fue eliminado. Recargue la pantalla.';
    case '42501':
      return 'No tiene permiso para hacer este cambio. Si debería tenerlo, solicíteselo a TI.';
    case 'PGRST301':
      return 'La sesión venció. Vuelva a ingresar.';
    default:
      break;
  }

  // Rechazo de una politica RLS en una escritura.
  if (texto.includes('row-level security')) {
    return 'No tiene permiso para hacer este cambio. Si debería tenerlo, solicíteselo a TI.';
  }

  return respaldo;
}
