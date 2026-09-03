/**
 * Seguimiento entre reuniones.
 *
 * Un informe es la foto de una reunion y no cambia. Lo que no se ve mirando un
 * informe solo es la evolucion: si las consultas subieron respecto de la
 * reunion anterior, o cuantas reuniones lleva una decision sin resolverse.
 *
 * Esto no calcula ninguna metrica nueva ni consulta ninguna API: recorre los
 * informes ya cargados y ordena lo que ya esta escrito en ellos.
 *
 * Los indicadores se siguen por su etiqueta. Si Marketing renombra "Sesiones en
 * el sitio" a "Sesiones web", la serie se corta y aparece como dos indicadores
 * distintos. Es a proposito: adivinar que dos etiquetas distintas son lo mismo
 * lleva a juntar series que no corresponden.
 */

import type { ContenidoAlertas, ContenidoIndicadores, FormatoValor, Tono } from '@/lib/bloques';
import type { Bloque, Informe } from '@/lib/tipos';

/** Tonos que marcan algo abierto: lo demas es informativo y no se arrastra. */
const TONOS_ABIERTOS: Tono[] = ['riesgo', 'pendiente'];

export type ReunionSeguida = {
  informeId: string;
  reunionFecha: string;
  periodoEtiqueta: string;
  esBorrador: boolean;
};

export type ValorEnReunion = {
  informeId: string;
  valor: string;
  numero: number | null;
};

export type SerieIndicador = {
  etiqueta: string;
  formato: FormatoValor;
  decimales?: number;
  /** Un valor por reunion, en el mismo orden que `reuniones`. Null donde no aparece. */
  valores: Array<ValorEnReunion | null>;
  /** Variacion porcentual entre las dos ultimas reuniones en que aparece. */
  variacion: number | null;
  mejorSiBaja: boolean;
};

export type DecisionSeguida = {
  titulo: string;
  tono: Tono;
  etiqueta: string;
  detalle: string;
  desde: string;
  hasta: string;
  reuniones: number;
  sigueAbierta: boolean;
};

export type Seguimiento = {
  reuniones: ReunionSeguida[];
  indicadores: SerieIndicador[];
  decisiones: DecisionSeguida[];
};

function aNumero(valor: string): number | null {
  const limpio = valor.trim().replace(/\s/g, '').replace('%', '').replace(',', '.');
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

/** Compara textos sin distinguir mayusculas, tildes ni espacios de sobra. */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Arma el seguimiento a partir de los informes y sus bloques.
 *
 * `informes` llega del mas nuevo al mas viejo, que es como los devuelve la
 * consulta; aca se invierten para leerlos de izquierda a derecha en el tiempo.
 */
export function armarSeguimiento(
  informes: Informe[],
  bloquesPorInforme: Map<string, Bloque[]>,
): Seguimiento {
  const ordenados = [...informes].sort((uno, otro) =>
    uno.reunion_fecha.localeCompare(otro.reunion_fecha),
  );

  const reuniones: ReunionSeguida[] = ordenados.map((informe) => ({
    informeId: informe.id,
    reunionFecha: informe.reunion_fecha,
    periodoEtiqueta: informe.periodo_etiqueta,
    esBorrador: informe.estado === 'borrador',
  }));

  const posicion = new Map(reuniones.map((reunion, indice) => [reunion.informeId, indice]));

  /* --- Indicadores ------------------------------------------------- */

  type SerieEnArmado = Omit<SerieIndicador, 'variacion'> & { variacion: number | null };
  const series = new Map<string, SerieEnArmado>();

  for (const informe of ordenados) {
    for (const bloque of bloquesPorInforme.get(informe.id) ?? []) {
      if (bloque.tipo !== 'indicadores') continue;

      for (const indicador of (bloque.contenido as ContenidoIndicadores).indicadores ?? []) {
        const clave = normalizar(indicador.etiqueta);
        if (clave === '') continue;

        let serie = series.get(clave);
        if (serie === undefined) {
          serie = {
            etiqueta: indicador.etiqueta,
            formato: indicador.formato,
            ...(indicador.decimales !== undefined ? { decimales: indicador.decimales } : {}),
            valores: reuniones.map(() => null),
            variacion: null,
            mejorSiBaja: indicador.mejorSiBaja === true,
          };
          series.set(clave, serie);
        }

        const indice = posicion.get(informe.id);
        if (indice === undefined) continue;

        serie.valores[indice] = {
          informeId: informe.id,
          valor: indicador.valor,
          numero: indicador.formato === 'texto' ? null : aNumero(indicador.valor),
        };
        // La etiqueta y el formato mas recientes mandan: son los que Marketing
        // decidio ultimo.
        serie.etiqueta = indicador.etiqueta;
        serie.formato = indicador.formato;
        serie.mejorSiBaja = indicador.mejorSiBaja === true;
      }
    }
  }

  const indicadores: SerieIndicador[] = Array.from(series.values()).map((serie) => {
    const presentes = serie.valores.filter((valor): valor is ValorEnReunion => valor !== null);
    const ultimo = presentes[presentes.length - 1];
    const anterior = presentes[presentes.length - 2];

    let variacion: number | null = null;
    if (
      ultimo !== undefined &&
      anterior !== undefined &&
      ultimo.numero !== null &&
      anterior.numero !== null &&
      anterior.numero !== 0
    ) {
      variacion = ((ultimo.numero - anterior.numero) / Math.abs(anterior.numero)) * 100;
    }

    return { ...serie, variacion };
  });

  /* --- Decisiones abiertas ------------------------------------------ */

  type DecisionEnArmado = Omit<DecisionSeguida, 'sigueAbierta' | 'reuniones'> & {
    informes: Set<string>;
  };
  const decisiones = new Map<string, DecisionEnArmado>();
  const ultimaReunion = reuniones[reuniones.length - 1];

  for (const informe of ordenados) {
    for (const bloque of bloquesPorInforme.get(informe.id) ?? []) {
      if (bloque.tipo !== 'alertas') continue;

      for (const alerta of (bloque.contenido as ContenidoAlertas).alertas ?? []) {
        if (!TONOS_ABIERTOS.includes(alerta.tono)) continue;

        const clave = normalizar(alerta.titulo);
        if (clave === '') continue;

        const existente = decisiones.get(clave);
        if (existente === undefined) {
          decisiones.set(clave, {
            titulo: alerta.titulo,
            tono: alerta.tono,
            etiqueta: alerta.etiqueta,
            detalle: alerta.detalle ?? '',
            desde: informe.reunion_fecha,
            hasta: informe.reunion_fecha,
            informes: new Set([informe.id]),
          });
          continue;
        }

        existente.hasta = informe.reunion_fecha;
        existente.informes.add(informe.id);
        // Lo ultimo que se escribio es lo vigente.
        existente.titulo = alerta.titulo;
        existente.tono = alerta.tono;
        existente.etiqueta = alerta.etiqueta;
        existente.detalle = alerta.detalle ?? '';
      }
    }
  }

  const listaDeDecisiones: DecisionSeguida[] = Array.from(decisiones.values())
    .map((decision) => ({
      titulo: decision.titulo,
      tono: decision.tono,
      etiqueta: decision.etiqueta,
      detalle: decision.detalle,
      desde: decision.desde,
      hasta: decision.hasta,
      reuniones: decision.informes.size,
      sigueAbierta: ultimaReunion !== undefined && decision.informes.has(ultimaReunion.informeId),
    }))
    // Primero lo que sigue abierto, y dentro de eso lo que lleva mas reuniones.
    .sort((una, otra) => {
      if (una.sigueAbierta !== otra.sigueAbierta) return una.sigueAbierta ? -1 : 1;
      if (una.reuniones !== otra.reuniones) return otra.reuniones - una.reuniones;
      return una.titulo.localeCompare(otra.titulo, 'es');
    });

  return { reuniones, indicadores, decisiones: listaDeDecisiones };
}
