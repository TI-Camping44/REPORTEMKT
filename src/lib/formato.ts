/**
 * Formatos centralizados de la aplicacion.
 *
 * Ningun componente arma fechas ni montos por su cuenta: todo pasa por aca.
 * Asi un cambio de criterio se hace en un solo lugar y no quedan dos formatos
 * distintos para el mismo dato en pantallas distintas.
 */

export const ZONA_HORARIA = 'America/Asuncion';

const LOCALIZACION = 'es-PY';

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Convierte a Date lo que llega de la base de datos.
 *
 * Las columnas `date` de PostgreSQL llegan como "2026-08-31", sin hora ni huso.
 * Si se las pasa tal cual a new Date() el motor las interpreta como medianoche
 * UTC y, al mostrarlas en Asuncion (UTC-3), aparecen un dia antes. Por eso se
 * las ancla al mediodia UTC: a esa hora ningun huso razonable cambia el dia.
 */
function interpretarFecha(valor: string | Date): Date | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  const coincidencia = SOLO_FECHA.exec(valor);
  if (coincidencia) {
    const anio = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]);
    const dia = Number(coincidencia[3]);
    return new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
  }

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** 31/08/2026 */
export function formatearFecha(valor: string | Date | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const fecha = interpretarFecha(valor);
  if (fecha === null) return '—';

  return new Intl.DateTimeFormat(LOCALIZACION, {
    timeZone: ZONA_HORARIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha);
}

/** 31/08/2026 14:30 */
export function formatearFechaHora(valor: string | Date | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const fecha = interpretarFecha(valor);
  if (fecha === null) return '—';

  const partes = new Intl.DateTimeFormat(LOCALIZACION, {
    timeZone: ZONA_HORARIA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(fecha);

  const buscar = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '';

  return `${buscar('day')}/${buscar('month')}/${buscar('year')} ${buscar('hour')}:${buscar('minute')}`;
}

/** 31 de agosto de 2026 */
export function formatearFechaLarga(valor: string | Date | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const fecha = interpretarFecha(valor);
  if (fecha === null) return '—';

  return new Intl.DateTimeFormat(LOCALIZACION, {
    timeZone: ZONA_HORARIA,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/** agosto 2026 */
export function formatearMes(valor: string | Date | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const fecha = interpretarFecha(valor);
  if (fecha === null) return '—';

  return new Intl.DateTimeFormat(LOCALIZACION, {
    timeZone: ZONA_HORARIA,
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/**
 * Gs. 3.711.850
 *
 * El guarani no usa decimales. Se arma el separador de miles con la
 * localizacion y se antepone el simbolo a mano, en lugar de usar el estilo
 * `currency` de Intl, porque ese estilo cambia de forma entre versiones de ICU
 * y el informe lo lee Direccion: el formato tiene que ser siempre el mismo.
 */
export function formatearGuaranies(valor: number | string | null | undefined): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (numero === null || numero === undefined || Number.isNaN(numero)) return '—';

  const absoluto = new Intl.NumberFormat(LOCALIZACION, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(numero)));

  return numero < 0 ? `-Gs. ${absoluto}` : `Gs. ${absoluto}`;
}

/** 12.345 o 12.345,6 segun los decimales pedidos */
export function formatearNumero(
  valor: number | string | null | undefined,
  decimales = 0,
): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (numero === null || numero === undefined || Number.isNaN(numero)) return '—';

  return new Intl.NumberFormat(LOCALIZACION, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
}

/** +12,4 % / -3,0 % — el signo es explicito porque indica variacion. */
export function formatearVariacion(
  valor: number | string | null | undefined,
  decimales = 1,
): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (numero === null || numero === undefined || Number.isNaN(numero)) return '—';

  const signo = numero > 0 ? '+' : '';
  return `${signo}${formatearNumero(numero, decimales)} %`;
}

/** 12,4 % — sin signo, para participaciones y proporciones. */
export function formatearPorcentaje(
  valor: number | string | null | undefined,
  decimales = 1,
): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (numero === null || numero === undefined || Number.isNaN(numero)) return '—';

  return `${formatearNumero(numero, decimales)} %`;
}

/** Devuelve la fecha de hoy en Asuncion como "AAAA-MM-DD", lista para una columna date. */
export function fechaDeHoyEnAsuncion(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return partes;
}

/**
 * Formatea un valor segun el formato declarado en el bloque.
 *
 * Marketing elige el formato al cargar el dato; el componente no decide nada.
 * Asi el mismo monto se ve igual en un indicador y en una celda de tabla.
 */
export function formatearValor(
  valor: string | number | null | undefined,
  formato: 'texto' | 'numero' | 'guaranies' | 'porcentaje',
  decimales?: number,
): string {
  if (valor === null || valor === undefined || valor === '') return '—';

  if (formato === 'texto') return String(valor);

  // Marketing puede escribir el numero con coma decimal.
  const numero = typeof valor === 'number' ? valor : Number(String(valor).replace(/\s/g, '').replace(',', '.'));
  if (Number.isNaN(numero)) return String(valor);

  if (formato === 'guaranies') return formatearGuaranies(numero);
  if (formato === 'porcentaje') return formatearPorcentaje(numero, decimales ?? 1);
  return formatearNumero(numero, decimales ?? 0);
}
