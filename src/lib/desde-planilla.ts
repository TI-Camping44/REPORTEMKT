/**
 * Conversion de las celdas de una planilla al contenido de un bloque.
 *
 * Solo dos tipos de bloque se pueden vincular: `tabla` e `indicadores`. Los
 * demas no salen de ninguna planilla: la agenda, los hitos, las alertas y los
 * pendientes de Direccion son criterio de Marketing.
 *
 * Forma que espera cada uno, documentada tambien para quien arme la hoja:
 *
 *   tabla         La primera fila son los titulos de las columnas. Cada fila
 *                 siguiente es una fila del cuadro. Una fila cuyo primer valor
 *                 empiece con "Total" se toma como fila de totales.
 *
 *                 Cuando el titulo de una columna coincide con una que el
 *                 bloque ya tenia, se conserva su formato, su alineacion y sus
 *                 colores de estado: la planilla trae los datos, no el diseno.
 *
 *   indicadores   La primera fila son encabezados. Se reconocen: etiqueta,
 *                 valor, formato, decimales, variacion, detalle y mejorSiBaja.
 *                 etiqueta y valor son obligatorios; el resto es opcional.
 */

import {
  FORMATOS_VALOR,
  type ColumnaTabla,
  type ContenidoIndicadores,
  type ContenidoTabla,
  type FilaTabla,
  type FormatoValor,
  type Indicador,
  type TipoBloque,
} from '@/lib/bloques';

export const TIPOS_VINCULABLES: TipoBloque[] = ['tabla', 'indicadores'];

export function esTipoVinculable(tipo: TipoBloque): boolean {
  return TIPOS_VINCULABLES.includes(tipo);
}

/** Compara textos sin distinguir mayusculas, tildes ni espacios de sobra. */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function aClave(titulo: string, usadas: string[]): string {
  const base = normalizar(titulo)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const inicial = base === '' ? 'columna' : base;
  let candidata = inicial;
  let sufijo = 2;

  while (usadas.includes(candidata)) {
    candidata = `${inicial}_${sufijo}`;
    sufijo += 1;
  }

  return candidata;
}

function filaVacia(fila: string[]): boolean {
  return fila.every((celda) => celda.trim() === '');
}

function aNumeroOpcional(valor: string): number | null {
  const limpio = valor.trim().replace(/\s/g, '').replace('%', '').replace(',', '.');
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

export type ResultadoConversion =
  | { exito: true; contenido: ContenidoTabla | ContenidoIndicadores }
  | { exito: false; error: string };

export function convertirDesdePlanilla(
  tipo: TipoBloque,
  filas: string[][],
  contenidoActual: unknown,
): ResultadoConversion {
  if (filas.length === 0) {
    return { exito: false, error: 'El rango no devolvió ninguna fila. Revise que apunte a las celdas correctas.' };
  }

  if (tipo === 'tabla') return convertirTabla(filas, contenidoActual);
  if (tipo === 'indicadores') return convertirIndicadores(filas);

  return {
    exito: false,
    error: 'Solo los bloques de tabla y de indicadores se pueden vincular a una planilla.',
  };
}

function convertirTabla(filas: string[][], contenidoActual: unknown): ResultadoConversion {
  const encabezados = filas[0] ?? [];
  const titulos = encabezados.map((titulo) => titulo.trim());

  if (titulos.every((titulo) => titulo === '')) {
    return { exito: false, error: 'La primera fila del rango tiene que traer los títulos de las columnas.' };
  }

  const anteriores = ((contenidoActual as ContenidoTabla | null)?.columnas ?? []) as ColumnaTabla[];
  const claves: string[] = [];

  const columnas: ColumnaTabla[] = titulos.map((titulo, indice) => {
    const nombre = titulo !== '' ? titulo : `Columna ${indice + 1}`;
    // Si la columna ya existia con ese titulo, se conserva su configuracion:
    // la planilla trae los datos, no el diseno del cuadro.
    const anterior = anteriores.find((columna) => normalizar(columna.titulo) === normalizar(nombre));
    const clave = anterior?.clave ?? aClave(nombre, claves);
    claves.push(clave);

    return anterior !== undefined
      ? { ...anterior, titulo: nombre, clave }
      : { clave, titulo: nombre, alineacion: 'izquierda' as const, formato: 'texto' as const };
  });

  const cuerpo: FilaTabla[] = [];
  let total: FilaTabla | null = null;

  for (const fila of filas.slice(1)) {
    if (filaVacia(fila)) continue;

    const armada: FilaTabla = {};
    columnas.forEach((columna, indice) => {
      armada[columna.clave] = (fila[indice] ?? '').trim();
    });

    const primera = normalizar(String(fila[0] ?? ''));
    if (primera.startsWith('total')) {
      total = armada;
      continue;
    }

    cuerpo.push(armada);
  }

  const nota = (contenidoActual as ContenidoTabla | null)?.nota;

  return {
    exito: true,
    contenido: {
      columnas,
      filas: cuerpo,
      total,
      ...(nota !== undefined && nota !== '' ? { nota } : {}),
    },
  };
}

const ALIAS_DE_COLUMNA: Record<string, string> = {
  etiqueta: 'etiqueta',
  indicador: 'etiqueta',
  concepto: 'etiqueta',
  valor: 'valor',
  formato: 'formato',
  decimales: 'decimales',
  variacion: 'variacion',
  detalle: 'detalle',
  mejorsibaja: 'mejorSiBaja',
};

function convertirIndicadores(filas: string[][]): ResultadoConversion {
  const encabezados = (filas[0] ?? []).map((titulo) => ALIAS_DE_COLUMNA[normalizar(titulo).replace(/[^a-z]/g, '')] ?? '');

  const posicion = (campo: string) => encabezados.indexOf(campo);
  const columnaEtiqueta = posicion('etiqueta');
  const columnaValor = posicion('valor');

  if (columnaEtiqueta === -1 || columnaValor === -1) {
    return {
      exito: false,
      error:
        'La primera fila del rango tiene que traer los encabezados «etiqueta» y «valor». Los demás (formato, decimales, variación, detalle) son opcionales.',
    };
  }

  const indicadores: Indicador[] = [];

  for (const fila of filas.slice(1)) {
    if (filaVacia(fila)) continue;

    const etiqueta = (fila[columnaEtiqueta] ?? '').trim();
    const valor = (fila[columnaValor] ?? '').trim();
    if (etiqueta === '' && valor === '') continue;

    const formatoCrudo = normalizar((fila[posicion('formato')] ?? '').toString());
    const formato: FormatoValor = (FORMATOS_VALOR as readonly string[]).includes(formatoCrudo)
      ? (formatoCrudo as FormatoValor)
      : aNumeroOpcional(valor) !== null
        ? 'numero'
        : 'texto';

    const decimales = aNumeroOpcional(fila[posicion('decimales')] ?? '');
    const variacion = aNumeroOpcional(fila[posicion('variacion')] ?? '');
    const detalle = (fila[posicion('detalle')] ?? '').trim();
    const mejorSiBaja = normalizar(fila[posicion('mejorSiBaja')] ?? '');

    indicadores.push({
      etiqueta,
      valor,
      formato,
      ...(decimales !== null ? { decimales } : {}),
      variacion,
      ...(detalle !== '' ? { detalle } : {}),
      ...(mejorSiBaja === 'si' || mejorSiBaja === 'sí' || mejorSiBaja === 'true' || mejorSiBaja === 'x'
        ? { mejorSiBaja: true }
        : {}),
    });
  }

  if (indicadores.length === 0) {
    return { exito: false, error: 'El rango no trajo ningún indicador con etiqueta y valor.' };
  }

  return { exito: true, contenido: { indicadores } };
}
