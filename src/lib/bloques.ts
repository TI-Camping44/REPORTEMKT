/**
 * Forma del contenido jsonb de cada tipo de bloque.
 *
 * La misma estructura esta documentada en el encabezado de la migracion
 * 20260903170200_documentar_bloques_y_agregar_accion.sql. Si cambia una, cambia
 * la otra en el mismo commit: un jsonb sin forma escrita en algun lado es un
 * campo libre que en seis meses nadie sabe leer.
 */

export const TIPOS_BLOQUE = [
  'indicadores',
  'agenda',
  'linea_tiempo',
  'alertas',
  'hitos',
  'tabla',
  'calendario',
  'fichas',
  'texto',
  'enlaces',
] as const;

export type TipoBloque = (typeof TIPOS_BLOQUE)[number];

export const ETIQUETAS_TIPO_BLOQUE: Record<TipoBloque, string> = {
  indicadores: 'Indicadores',
  agenda: 'Agenda',
  linea_tiempo: 'Línea de tiempo',
  alertas: 'Estado y alertas',
  hitos: 'Hitos',
  tabla: 'Tabla',
  calendario: 'Calendario',
  fichas: 'Fichas',
  texto: 'Texto',
  enlaces: 'Enlaces',
};

export const DESCRIPCIONES_TIPO_BLOQUE: Record<TipoBloque, string> = {
  indicadores: 'Cifras destacadas con su variacion respecto del periodo anterior.',
  agenda: 'Temas a tratar en la reunion, con el origen de cada uno. Se tildan a medida que se tratan.',
  linea_tiempo: 'Avance de una campana en pasos con fecha: hecho, actual y proximo.',
  alertas: 'Estado general y puntos que requieren decision, con su chip de color.',
  hitos: 'Logros y pendientes del periodo, con responsable y fecha.',
  tabla: 'Cuadro de columnas y filas, con fila de totales opcional.',
  calendario: 'Grilla mensual de eventos y activaciones, con la lista de proximos.',
  fichas: 'Tarjetas con detalle desplegable: influencers, acuerdos, proveedores.',
  texto: 'Comentario libre en parrafos.',
  enlaces: 'Accesos a documentos externos relacionados con este bloque.',
};

/* ------------------------------------------------------------------ */
/* Tonos, comunes a varios tipos                                       */
/* ------------------------------------------------------------------ */

export const TONOS = ['ok', 'curso', 'pendiente', 'riesgo', 'pausa', 'neutro'] as const;

export type Tono = (typeof TONOS)[number];

/** Nombre del tono en el selector del editor. La etiqueta que ve Direccion la escribe Marketing. */
export const ETIQUETAS_TONO: Record<Tono, string> = {
  ok: 'Verde — hecho, aprobado, activo',
  curso: 'Azul — en marcha',
  pendiente: 'Ámbar — esperando algo',
  riesgo: 'Rojo — decidir ya, bloqueado',
  pausa: 'Gris — detenido a propósito',
  neutro: 'Gris — informativo',
};

export function esTono(valor: unknown): valor is Tono {
  return typeof valor === 'string' && (TONOS as readonly string[]).includes(valor);
}

/* ------------------------------------------------------------------ */
/* Formato de los valores numericos                                    */
/* ------------------------------------------------------------------ */

export const FORMATOS_VALOR = ['texto', 'numero', 'guaranies', 'porcentaje'] as const;

export type FormatoValor = (typeof FORMATOS_VALOR)[number];

export const ETIQUETAS_FORMATO_VALOR: Record<FormatoValor, string> = {
  texto: 'Texto tal cual',
  numero: 'Número',
  guaranies: 'Guaraníes',
  porcentaje: 'Porcentaje',
};

/** Los formatos que admite una columna de tabla: los de arriba mas el chip de estado. */
export const FORMATOS_COLUMNA = [...FORMATOS_VALOR, 'estado'] as const;

export type FormatoColumna = (typeof FORMATOS_COLUMNA)[number];

export const ETIQUETAS_FORMATO_COLUMNA: Record<FormatoColumna, string> = {
  ...ETIQUETAS_FORMATO_VALOR,
  estado: 'Chip de estado',
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
/* agenda                                                              */
/* ------------------------------------------------------------------ */

export type PuntoAgenda = {
  texto: string;
  /** De donde sale el punto: "Minuta 23/07", "Pedido de Dirección", "Informativo". */
  origen?: string;
  /** Queda guardado: es la constancia de que el tema se trato. */
  tratado: boolean;
};

export type ContenidoAgenda = {
  introduccion?: string;
  puntos: PuntoAgenda[];
};

/* ------------------------------------------------------------------ */
/* linea_tiempo                                                        */
/* ------------------------------------------------------------------ */

export const ESTADOS_PASO = ['hecho', 'actual', 'proximo'] as const;

export type EstadoPaso = (typeof ESTADOS_PASO)[number];

export const ETIQUETAS_ESTADO_PASO: Record<EstadoPaso, string> = {
  hecho: 'Hecho',
  actual: 'En curso',
  proximo: 'Próximo',
};

export type PasoLineaTiempo = {
  /** Texto libre: "07/08", "Sept–Oct". No es una fecha que se opere. */
  fecha: string;
  titulo: string;
  estado: EstadoPaso;
};

export type ContenidoLineaTiempo = {
  pasos: PasoLineaTiempo[];
};

/* ------------------------------------------------------------------ */
/* alertas                                                             */
/* ------------------------------------------------------------------ */

export type EnlaceCorto = {
  titulo: string;
  url: string;
};

export type Alerta = {
  tono: Tono;
  /** Texto del chip: "Aprobada", "Decidir ya", "Pausado". Lo escribe Marketing. */
  etiqueta: string;
  titulo: string;
  detalle?: string;
  enlaces?: EnlaceCorto[];
};

export type ContenidoAlertas = {
  alertas: Alerta[];
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
  formato?: FormatoColumna;
  decimales?: number;
  /** Solo para el formato "estado": que color le toca a cada texto de celda. */
  tonos?: Record<string, Tono>;
};

export type FilaTabla = Record<string, string | number | null>;

export type ContenidoTabla = {
  columnas: ColumnaTabla[];
  filas: FilaTabla[];
  /** Fila de cierre, resaltada. Se escribe tal cual, sin sumar nada por su cuenta. */
  total?: FilaTabla | null;
  nota?: string;
};

/* ------------------------------------------------------------------ */
/* calendario                                                          */
/* ------------------------------------------------------------------ */

export const TIPOS_EVENTO = ['evento', 'activacion'] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const ETIQUETAS_TIPO_EVENTO: Record<TipoEvento, string> = {
  evento: 'Evento',
  activacion: 'Activación',
};

export type EventoCalendario = {
  dia: number;
  nombre: string;
  tipo: TipoEvento;
};

export type ProximoCalendario = {
  /** Texto libre: "26–28/09". Un proximo puede abarcar varios dias o meses. */
  fecha: string;
  nombre: string;
};

export type ContenidoCalendario = {
  /** Mes que se dibuja, en formato AAAA-MM. */
  mes: string;
  eventos: EventoCalendario[];
  proximos?: ProximoCalendario[];
};

/* ------------------------------------------------------------------ */
/* fichas                                                              */
/* ------------------------------------------------------------------ */

export type CampoFicha = {
  etiqueta: string;
  valor: string;
};

export type Ficha = {
  nombre: string;
  rol?: string;
  marca?: string;
  tono: Tono;
  estado: string;
  campos?: CampoFicha[];
  materiales?: EnlaceCorto[];
};

export type ContenidoFichas = {
  introduccion?: string;
  fichas: Ficha[];
};

/* ------------------------------------------------------------------ */
/* texto y enlaces                                                     */
/* ------------------------------------------------------------------ */

export type ContenidoTexto = {
  /** Parrafos separados por una linea en blanco. No se interpreta Markdown. */
  texto: string;
};

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

export type ContenidoPorTipo = {
  indicadores: ContenidoIndicadores;
  agenda: ContenidoAgenda;
  linea_tiempo: ContenidoLineaTiempo;
  alertas: ContenidoAlertas;
  hitos: ContenidoHitos;
  tabla: ContenidoTabla;
  calendario: ContenidoCalendario;
  fichas: ContenidoFichas;
  texto: ContenidoTexto;
  enlaces: ContenidoEnlaces;
};

export type ContenidoBloque = ContenidoPorTipo[TipoBloque];

/** Contenido inicial de un bloque recien creado, para que nunca nazca vacio. */
export function contenidoPorDefecto<T extends TipoBloque>(tipo: T): ContenidoPorTipo[T] {
  const porDefecto: ContenidoPorTipo = {
    indicadores: {
      indicadores: [{ etiqueta: '', valor: '', formato: 'numero', variacion: null }],
    },
    agenda: {
      introduccion: '',
      puntos: [{ texto: '', origen: '', tratado: false }],
    },
    linea_tiempo: {
      pasos: [{ fecha: '', titulo: '', estado: 'proximo' }],
    },
    alertas: {
      alertas: [{ tono: 'pendiente', etiqueta: 'Pendiente', titulo: '' }],
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
      total: null,
    },
    calendario: {
      mes: '',
      eventos: [],
      proximos: [],
    },
    fichas: {
      introduccion: '',
      fichas: [{ nombre: '', tono: 'ok', estado: 'Activo', campos: [], materiales: [] }],
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

function esTextoConContenido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}

const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

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
        if (!esTextoConContenido(indicador.etiqueta)) return 'Cada indicador necesita una etiqueta.';
        if (!esTextoConContenido(indicador.valor)) {
          return `Complete el valor del indicador "${indicador.etiqueta}".`;
        }
        if (!(FORMATOS_VALOR as readonly unknown[]).includes(indicador.formato)) {
          return `El formato del indicador "${indicador.etiqueta}" no es válido.`;
        }
        if (
          indicador.formato !== 'texto' &&
          Number.isNaN(Number(String(indicador.valor).replace(',', '.')))
        ) {
          return `El valor del indicador "${indicador.etiqueta}" debe ser un número, o elija el formato "Texto tal cual".`;
        }
      }
      return null;
    }

    case 'agenda': {
      if (!esArreglo(contenido.puntos)) return 'La agenda necesita una lista de puntos.';
      if (contenido.puntos.length === 0) return 'Agregue al menos un punto a la agenda.';
      for (const punto of contenido.puntos) {
        if (!esObjeto(punto)) return 'Cada punto de la agenda debe ser un objeto.';
        if (!esTextoConContenido(punto.texto)) return 'Cada punto de la agenda necesita un texto.';
        if (typeof punto.tratado !== 'boolean') return 'El estado de cada punto debe ser verdadero o falso.';
      }
      return null;
    }

    case 'linea_tiempo': {
      if (!esArreglo(contenido.pasos)) return 'La línea de tiempo necesita una lista de pasos.';
      if (contenido.pasos.length === 0) return 'Agregue al menos un paso.';
      for (const paso of contenido.pasos) {
        if (!esObjeto(paso)) return 'Cada paso debe ser un objeto.';
        if (!esTextoConContenido(paso.titulo)) return 'Cada paso necesita un título.';
        if (!esTextoConContenido(paso.fecha)) return `El paso "${paso.titulo}" necesita una fecha.`;
        if (!(ESTADOS_PASO as readonly unknown[]).includes(paso.estado)) {
          return `El estado del paso "${paso.titulo}" no es válido.`;
        }
      }
      return null;
    }

    case 'alertas': {
      if (!esArreglo(contenido.alertas)) return 'El bloque necesita una lista de puntos.';
      if (contenido.alertas.length === 0) return 'Agregue al menos un punto.';
      for (const alerta of contenido.alertas) {
        if (!esObjeto(alerta)) return 'Cada punto debe ser un objeto.';
        if (!esTextoConContenido(alerta.titulo)) return 'Cada punto necesita un título.';
        if (!esTextoConContenido(alerta.etiqueta)) {
          return `El punto "${alerta.titulo}" necesita el texto de su chip, por ejemplo "Aprobada" o "Decidir ya".`;
        }
        if (!esTono(alerta.tono)) return `El tono del punto "${alerta.titulo}" no es válido.`;
        if (alerta.enlaces !== undefined && alerta.enlaces !== null) {
          if (!esArreglo(alerta.enlaces)) return `Los enlaces del punto "${alerta.titulo}" deben ser una lista.`;
          for (const enlace of alerta.enlaces) {
            if (!esObjeto(enlace) || !esTextoConContenido(enlace.titulo)) {
              return `Cada enlace del punto "${alerta.titulo}" necesita un título.`;
            }
            if (typeof enlace.url !== 'string' || !/^https?:\/\//i.test(enlace.url)) {
              return `La dirección del enlace "${String(enlace.titulo)}" debe empezar con http:// o https://`;
            }
          }
        }
      }
      return null;
    }

    case 'hitos': {
      if (!esArreglo(contenido.hitos)) return 'El bloque de hitos necesita una lista de hitos.';
      if (contenido.hitos.length === 0) return 'Agregue al menos un hito.';
      for (const hito of contenido.hitos) {
        if (!esObjeto(hito)) return 'Cada hito debe ser un objeto.';
        if (!esTextoConContenido(hito.titulo)) return 'Cada hito necesita un título.';
        if (!(ESTADOS_HITO as readonly unknown[]).includes(hito.estado)) {
          return `El estado del hito "${hito.titulo}" no es válido.`;
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
        if (!esTextoConContenido(columna.clave)) return 'Cada columna necesita una clave.';
        if (!esTextoConContenido(columna.titulo)) {
          return `La columna "${String(columna.clave)}" necesita un título.`;
        }
        if (claves.has(columna.clave)) {
          return `La clave de columna "${columna.clave}" está repetida.`;
        }
        claves.add(columna.clave);
      }
      if (!esArreglo(contenido.filas)) return 'La tabla necesita una lista de filas.';
      if (
        contenido.total !== undefined &&
        contenido.total !== null &&
        !esObjeto(contenido.total)
      ) {
        return 'La fila de totales debe ser un objeto con las mismas claves que las columnas.';
      }
      return null;
    }

    case 'calendario': {
      if (!esTextoConContenido(contenido.mes) || !MES_VALIDO.test(contenido.mes)) {
        return 'Indique el mes del calendario en formato AAAA-MM, por ejemplo 2026-08.';
      }
      if (!esArreglo(contenido.eventos)) return 'El calendario necesita una lista de eventos.';
      for (const evento of contenido.eventos) {
        if (!esObjeto(evento)) return 'Cada evento debe ser un objeto.';
        if (!esTextoConContenido(evento.nombre)) return 'Cada evento necesita un nombre.';
        const dia = Number(evento.dia);
        if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
          return `El día del evento "${String(evento.nombre)}" debe ser un número entre 1 y 31.`;
        }
        if (!(TIPOS_EVENTO as readonly unknown[]).includes(evento.tipo)) {
          return `El tipo del evento "${String(evento.nombre)}" debe ser evento o activación.`;
        }
      }
      if (contenido.proximos !== undefined && contenido.proximos !== null) {
        if (!esArreglo(contenido.proximos)) return 'Los próximos deben ser una lista.';
        for (const proximo of contenido.proximos) {
          if (!esObjeto(proximo)) return 'Cada próximo debe ser un objeto.';
          if (!esTextoConContenido(proximo.nombre)) return 'Cada próximo necesita un nombre.';
          if (!esTextoConContenido(proximo.fecha)) {
            return `El próximo "${String(proximo.nombre)}" necesita una fecha.`;
          }
        }
      }
      return null;
    }

    case 'fichas': {
      if (!esArreglo(contenido.fichas)) return 'El bloque necesita una lista de fichas.';
      if (contenido.fichas.length === 0) return 'Agregue al menos una ficha.';
      for (const ficha of contenido.fichas) {
        if (!esObjeto(ficha)) return 'Cada ficha debe ser un objeto.';
        if (!esTextoConContenido(ficha.nombre)) return 'Cada ficha necesita un nombre.';
        if (!esTextoConContenido(ficha.estado)) {
          return `La ficha "${ficha.nombre}" necesita el texto de su chip de estado.`;
        }
        if (!esTono(ficha.tono)) return `El tono de la ficha "${ficha.nombre}" no es válido.`;
        if (ficha.materiales !== undefined && ficha.materiales !== null) {
          if (!esArreglo(ficha.materiales)) return `Los materiales de "${ficha.nombre}" deben ser una lista.`;
          for (const material of ficha.materiales) {
            if (!esObjeto(material) || !esTextoConContenido(material.titulo)) {
              return `Cada material de "${ficha.nombre}" necesita un título.`;
            }
            if (typeof material.url !== 'string' || !/^https?:\/\//i.test(material.url)) {
              return `La dirección del material "${String(material.titulo)}" debe empezar con http:// o https://`;
            }
          }
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
        if (!esTextoConContenido(enlace.titulo)) return 'Cada enlace necesita un título.';
        if (typeof enlace.url !== 'string' || !/^https?:\/\//i.test(enlace.url)) {
          return `La dirección del enlace "${String(enlace.titulo)}" debe empezar con http:// o https://`;
        }
      }
      return null;
    }

    default:
      return 'Tipo de bloque desconocido.';
  }
}
