/**
 * Forma del contenido jsonb de cada tipo de bloque.
 *
 * La misma estructura esta documentada en el encabezado de la migracion que
 * crea la tabla `bloques`. Si cambia una, cambian las dos: un jsonb sin forma
 * escrita en algun lado es un campo libre que en seis meses nadie sabe leer.
 */

export const TIPOS_BLOQUE = [
  'indicadores',
  'hitos',
  'tabla',
  'alertas',
  'texto',
  'enlaces',
] as const;

export type TipoBloque = (typeof TIPOS_BLOQUE)[number];

export const ETIQUETAS_TIPO_BLOQUE: Record<TipoBloque, string> = {
  indicadores: 'Indicadores',
  hitos: 'Hitos',
  tabla: 'Tabla',
  alertas: 'Alertas',
  texto: 'Texto',
  enlaces: 'Enlaces',
};

export const DESCRIPCIONES_TIPO_BLOQUE: Record<TipoBloque, string> = {
  indicadores: 'Cifras destacadas con su variacion respecto del periodo anterior.',
  hitos: 'Estado de campanas, acuerdos y proyectos, con responsable y fecha.',
  tabla: 'Cuadro de columnas y filas cargado a mano.',
  alertas: 'Puntos que requieren decision o atencion de Direccion.',
  texto: 'Comentario libre en parrafos.',
  enlaces: 'Accesos a documentos externos relacionados con este informe.',
};

/* ------------------------------------------------------------------ */
/* Formato de los valores numericos                                    */
/* ------------------------------------------------------------------ */

export const FORMATOS_VALOR = ['texto', 'numero', 'guaranies', 'porcentaje'] as const;

export type FormatoValor = (typeof FORMATOS_VALOR)[number];

export const ETIQUETAS_FORMATO_VALOR: Record<FormatoValor, string> = {
  texto: 'Texto tal cual',
  numero: 'Numero',
  guaranies: 'Guaranies',
  porcentaje: 'Porcentaje',
};

/* ------------------------------------------------------------------ */
/* indicadores                                                         */
/* ------------------------------------------------------------------ */

export type Indicador = {
  etiqueta: string;
  valor: string;
  formato: FormatoValor;
  decimales?: number;
  /** Variacion porcentual respecto del periodo anterior. Vacio si no aplica. */
  variacion?: number | null;
  /** Cuando es true, una variacion negativa se muestra como buena (por ejemplo, costo por clic). */
  mejorSiBaja?: boolean;
  detalle?: string;
};

export type ContenidoIndicadores = {
  indicadores: Indicador[];
};

/* ------------------------------------------------------------------ */
/* hitos                                                               */
/* ------------------------------------------------------------------ */

export const ESTADOS_HITO = ['pendiente', 'en_curso', 'completado', 'bloqueado'] as const;

export type EstadoHito = (typeof ESTADOS_HITO)[number];

export const ETIQUETAS_ESTADO_HITO: Record<EstadoHito, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completado: 'Completado',
  bloqueado: 'Bloqueado',
};

export type Hito = {
  titulo: string;
  detalle?: string;
  estado: EstadoHito;
  responsable?: string;
  /** Fecha en formato AAAA-MM-DD. */
  fecha?: string | null;
};

export type ContenidoHitos = {
  hitos: Hito[];
};

/* ------------------------------------------------------------------ */
/* tabla                                                               */
/* ------------------------------------------------------------------ */

export const ALINEACIONES = ['izquierda', 'centro', 'derecha'] as const;

export type Alineacion = (typeof ALINEACIONES)[number];

export type ColumnaTabla = {
  clave: string;
  titulo: string;
  alineacion?: Alineacion;
  formato?: FormatoValor;
  decimales?: number;
};

export type ContenidoTabla = {
  columnas: ColumnaTabla[];
  /** Cada fila es un objeto con las claves declaradas en `columnas`. */
  filas: Array<Record<string, string | number | null>>;
  nota?: string;
};

/* ------------------------------------------------------------------ */
/* alertas                                                             */
/* ------------------------------------------------------------------ */

export const NIVELES_ALERTA = ['informacion', 'advertencia', 'critica'] as const;

export type NivelAlerta = (typeof NIVELES_ALERTA)[number];

export const ETIQUETAS_NIVEL_ALERTA: Record<NivelAlerta, string> = {
  informacion: 'Informacion',
  advertencia: 'Atencion',
  critica: 'Critica',
};

export type Alerta = {
  nivel: NivelAlerta;
  titulo: string;
  detalle?: string;
};

export type ContenidoAlertas = {
  alertas: Alerta[];
};

/* ------------------------------------------------------------------ */
/* texto                                                               */
/* ------------------------------------------------------------------ */

export type ContenidoTexto = {
  /** Parrafos separados por una linea en blanco. No se interpreta Markdown. */
  texto: string;
};

/* ------------------------------------------------------------------ */
/* enlaces                                                             */
/* ------------------------------------------------------------------ */

export type EnlaceBloque = {
  titulo: string;
  url: string;
  detalle?: string;
};

export type ContenidoEnlaces = {
  enlaces: EnlaceBloque[];
};

/* ------------------------------------------------------------------ */
/* Union                                                               */
/* ------------------------------------------------------------------ */

export type ContenidoBloque =
  | ContenidoIndicadores
  | ContenidoHitos
  | ContenidoTabla
  | ContenidoAlertas
  | ContenidoTexto
  | ContenidoEnlaces;

export type ContenidoPorTipo = {
  indicadores: ContenidoIndicadores;
  hitos: ContenidoHitos;
  tabla: ContenidoTabla;
  alertas: ContenidoAlertas;
  texto: ContenidoTexto;
  enlaces: ContenidoEnlaces;
};

/** Contenido inicial de un bloque recien creado, para que nunca nazca vacio. */
export function contenidoPorDefecto<T extends TipoBloque>(tipo: T): ContenidoPorTipo[T] {
  const porDefecto: ContenidoPorTipo = {
    indicadores: {
      indicadores: [{ etiqueta: '', valor: '', formato: 'numero', variacion: null }],
    },
    hitos: {
      hitos: [{ titulo: '', estado: 'en_curso' }],
    },
    tabla: {
      columnas: [
        { clave: 'concepto', titulo: 'Concepto', alineacion: 'izquierda' },
        { clave: 'valor', titulo: 'Valor', alineacion: 'derecha', formato: 'texto' },
      ],
      filas: [{ concepto: '', valor: '' }],
    },
    alertas: {
      alertas: [{ nivel: 'advertencia', titulo: '' }],
    },
    texto: { texto: '' },
    enlaces: {
      enlaces: [{ titulo: '', url: '' }],
    },
  };

  return porDefecto[tipo];
}

export function esTipoBloque(valor: unknown): valor is TipoBloque {
  return typeof valor === 'string' && (TIPOS_BLOQUE as readonly string[]).includes(valor);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esArreglo(valor: unknown): valor is unknown[] {
  return Array.isArray(valor);
}

/**
 * Valida la forma del contenido antes de escribirlo.
 *
 * Devuelve null cuando el contenido es valido, o un mensaje en espanol claro
 * que se le muestra a la persona. La base tiene ademas sus restricciones CHECK:
 * esta validacion es la que explica el problema, no la que lo impide.
 */
export function validarContenidoBloque(tipo: TipoBloque, contenido: unknown): string | null {
  if (!esObjeto(contenido)) {
    return 'El contenido del bloque debe ser un objeto.';
  }

  switch (tipo) {
    case 'indicadores': {
      if (!esArreglo(contenido.indicadores)) return 'El bloque de indicadores necesita una lista de indicadores.';
      if (contenido.indicadores.length === 0) return 'Agregue al menos un indicador.';
      for (const indicador of contenido.indicadores) {
        if (!esObjeto(indicador)) return 'Cada indicador debe ser un objeto.';
        if (typeof indicador.etiqueta !== 'string' || indicador.etiqueta.trim() === '') {
          return 'Cada indicador necesita una etiqueta.';
        }
        if (typeof indicador.valor !== 'string' || indicador.valor.trim() === '') {
          return `Complete el valor del indicador "${indicador.etiqueta}".`;
        }
        if (!(FORMATOS_VALOR as readonly unknown[]).includes(indicador.formato)) {
          return `El formato del indicador "${indicador.etiqueta}" no es valido.`;
        }
        if (
          indicador.formato !== 'texto' &&
          Number.isNaN(Number(String(indicador.valor).replace(',', '.')))
        ) {
          return `El valor del indicador "${indicador.etiqueta}" debe ser un numero, o elija el formato "Texto tal cual".`;
        }
      }
      return null;
    }

    case 'hitos': {
      if (!esArreglo(contenido.hitos)) return 'El bloque de hitos necesita una lista de hitos.';
      if (contenido.hitos.length === 0) return 'Agregue al menos un hito.';
      for (const hito of contenido.hitos) {
        if (!esObjeto(hito)) return 'Cada hito debe ser un objeto.';
        if (typeof hito.titulo !== 'string' || hito.titulo.trim() === '') {
          return 'Cada hito necesita un titulo.';
        }
        if (!(ESTADOS_HITO as readonly unknown[]).includes(hito.estado)) {
          return `El estado del hito "${hito.titulo}" no es valido.`;
        }
      }
      return null;
    }

    case 'tabla': {
      if (!esArreglo(contenido.columnas) || contenido.columnas.length === 0) {
        return 'La tabla necesita al menos una columna.';
      }
      const claves = new Set<string>();
      for (const columna of contenido.columnas) {
        if (!esObjeto(columna)) return 'Cada columna debe ser un objeto.';
        if (typeof columna.clave !== 'string' || columna.clave.trim() === '') {
          return 'Cada columna necesita una clave.';
        }
        if (typeof columna.titulo !== 'string' || columna.titulo.trim() === '') {
          return `La columna "${columna.clave}" necesita un titulo.`;
        }
        if (claves.has(columna.clave)) {
          return `La clave de columna "${columna.clave}" esta repetida.`;
        }
        claves.add(columna.clave);
      }
      if (!esArreglo(contenido.filas)) return 'La tabla necesita una lista de filas.';
      return null;
    }

    case 'alertas': {
      if (!esArreglo(contenido.alertas)) return 'El bloque de alertas necesita una lista de alertas.';
      if (contenido.alertas.length === 0) return 'Agregue al menos una alerta.';
      for (const alerta of contenido.alertas) {
        if (!esObjeto(alerta)) return 'Cada alerta debe ser un objeto.';
        if (typeof alerta.titulo !== 'string' || alerta.titulo.trim() === '') {
          return 'Cada alerta necesita un titulo.';
        }
        if (!(NIVELES_ALERTA as readonly unknown[]).includes(alerta.nivel)) {
          return `El nivel de la alerta "${alerta.titulo}" no es valido.`;
        }
      }
      return null;
    }

    case 'texto': {
      if (typeof contenido.texto !== 'string') return 'El bloque de texto necesita un texto.';
      if (contenido.texto.trim() === '') return 'Escriba el texto del bloque.';
      return null;
    }

    case 'enlaces': {
      if (!esArreglo(contenido.enlaces)) return 'El bloque de enlaces necesita una lista de enlaces.';
      if (contenido.enlaces.length === 0) return 'Agregue al menos un enlace.';
      for (const enlace of contenido.enlaces) {
        if (!esObjeto(enlace)) return 'Cada enlace debe ser un objeto.';
        if (typeof enlace.titulo !== 'string' || enlace.titulo.trim() === '') {
          return 'Cada enlace necesita un titulo.';
        }
        if (typeof enlace.url !== 'string' || !/^https?:\/\//i.test(enlace.url)) {
          return `La direccion del enlace "${String(enlace.titulo)}" debe empezar con http:// o https://`;
        }
      }
      return null;
    }

    default:
      return 'Tipo de bloque desconocido.';
  }
}
