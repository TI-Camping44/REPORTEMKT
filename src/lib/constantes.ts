/** Constantes compartidas entre servidor y cliente. */

export const NOMBRE_APLICACION = 'REPORTEMKT';

export const DESCRIPCION_APLICACION =
  'Informe de Marketing de Camping 44 S.A. para la reunion con Gerencia General.';

/** Alto en pixeles de un tablero de Looker cuando no se indica otro. */
export const ALTO_TABLERO_POR_DEFECTO = 1200;

/**
 * Permisos del iframe de Looker Studio.
 *
 * `allow-storage-access-by-user-activation` es el que permite que el visitante
 * autorice el acceso a las cookies de Google cuando el navegador las bloquea
 * por ser de terceros. Sin `allow-same-origin` el tablero no puede leer su
 * propia sesion; sin los dos de `popups` el boton de "ver en Looker" del propio
 * tablero queda muerto.
 */
export const PERMISOS_TABLERO =
  'allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

/** Ancho minimo con el que Looker dibuja sus informes de escritorio. */
export const ANCHO_MINIMO_TABLERO = 1000;

export const ESTADOS_INFORME = ['borrador', 'publicado'] as const;

export type EstadoInforme = (typeof ESTADOS_INFORME)[number];

export const ETIQUETAS_ESTADO_INFORME: Record<EstadoInforme, string> = {
  borrador: 'Borrador',
  publicado: 'Publicado',
};

export const TIPOS_PERIODO = ['quincenal', 'mensual'] as const;

export type TipoPeriodo = (typeof TIPOS_PERIODO)[number];

export const ETIQUETAS_TIPO_PERIODO: Record<TipoPeriodo, string> = {
  quincenal: 'Quincenal',
  mensual: 'Mensual',
};

export const ROLES_USUARIO = ['administrador', 'editor', 'lector'] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number];

export const ETIQUETAS_ROL_USUARIO: Record<RolUsuario, string> = {
  administrador: 'Administrador',
  editor: 'Editor',
  lector: 'Lector',
};

export const DESCRIPCIONES_ROL_USUARIO: Record<RolUsuario, string> = {
  administrador: 'TI. Administra usuarios y la configuracion de los tableros.',
  editor: 'Marketing. Crea, edita y publica los informes.',
  lector: 'Direccion. Consulta los informes publicados.',
};

/** Clave de la fila de `configuracion` donde vive el dominio corporativo. */
export const CLAVE_DOMINIO_PERMITIDO = 'dominio_permitido';
