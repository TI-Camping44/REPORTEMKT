/**
 * Calculo y rotulado de periodos.
 *
 * Todo se hace con aritmetica de fechas en UTC y cadenas "AAAA-MM-DD", que es
 * como viajan las columnas `date` de PostgreSQL. No se usa la hora local del
 * servidor en ningun punto: en Vercel el servidor esta en UTC y en Asuncion no,
 * y esa diferencia es la que corre los periodos un dia.
 */

import type { TipoPeriodo } from '@/lib/constantes';
import { ZONA_HORARIA } from '@/lib/formato';

export type Periodo = {
  tipo: TipoPeriodo;
  inicio: string;
  fin: string;
};

const NOMBRES_MES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

function aTexto(anio: number, mes: number, dia: number): string {
  const mesTexto = String(mes).padStart(2, '0');
  const diaTexto = String(dia).padStart(2, '0');
  return `${anio}-${mesTexto}-${diaTexto}`;
}

export function descomponerFecha(fecha: string): { anio: number; mes: number; dia: number } {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { anio: anio ?? 0, mes: mes ?? 1, dia: dia ?? 1 };
}

export function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Hoy en Asuncion, como "AAAA-MM-DD". */
export function hoyEnAsuncion(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Devuelve el periodo completo al que pertenece una fecha.
 *
 * Quincenal: del 1 al 15, y del 16 al ultimo dia del mes.
 * Mensual: del 1 al ultimo dia del mes.
 */
export function calcularPeriodo(tipo: TipoPeriodo, fecha: string): Periodo {
  const { anio, mes, dia } = descomponerFecha(fecha);
  const ultimo = ultimoDiaDelMes(anio, mes);

  if (tipo === 'mensual') {
    return { tipo, inicio: aTexto(anio, mes, 1), fin: aTexto(anio, mes, ultimo) };
  }

  if (dia <= 15) {
    return { tipo, inicio: aTexto(anio, mes, 1), fin: aTexto(anio, mes, 15) };
  }

  return { tipo, inicio: aTexto(anio, mes, 16), fin: aTexto(anio, mes, ultimo) };
}

/** Periodo inmediatamente anterior al que empieza en `inicio`. */
export function periodoAnterior(tipo: TipoPeriodo, inicio: string): Periodo {
  const { anio, mes, dia } = descomponerFecha(inicio);

  if (tipo === 'mensual') {
    const anioAnterior = mes === 1 ? anio - 1 : anio;
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    return {
      tipo,
      inicio: aTexto(anioAnterior, mesAnterior, 1),
      fin: aTexto(anioAnterior, mesAnterior, ultimoDiaDelMes(anioAnterior, mesAnterior)),
    };
  }

  if (dia === 16) {
    return { tipo, inicio: aTexto(anio, mes, 1), fin: aTexto(anio, mes, 15) };
  }

  const anioAnterior = mes === 1 ? anio - 1 : anio;
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  return {
    tipo,
    inicio: aTexto(anioAnterior, mesAnterior, 16),
    fin: aTexto(anioAnterior, mesAnterior, ultimoDiaDelMes(anioAnterior, mesAnterior)),
  };
}

/** Periodo siguiente al que empieza en `inicio`. */
export function periodoSiguiente(tipo: TipoPeriodo, inicio: string): Periodo {
  const { anio, mes, dia } = descomponerFecha(inicio);

  if (tipo === 'mensual') {
    const anioSiguiente = mes === 12 ? anio + 1 : anio;
    const mesSiguiente = mes === 12 ? 1 : mes + 1;
    return {
      tipo,
      inicio: aTexto(anioSiguiente, mesSiguiente, 1),
      fin: aTexto(anioSiguiente, mesSiguiente, ultimoDiaDelMes(anioSiguiente, mesSiguiente)),
    };
  }

  if (dia === 1) {
    return { tipo, inicio: aTexto(anio, mes, 16), fin: aTexto(anio, mes, ultimoDiaDelMes(anio, mes)) };
  }

  const anioSiguiente = mes === 12 ? anio + 1 : anio;
  const mesSiguiente = mes === 12 ? 1 : mes + 1;
  return { tipo, inicio: aTexto(anioSiguiente, mesSiguiente, 1), fin: aTexto(anioSiguiente, mesSiguiente, 15) };
}

/**
 * Lista de periodos recientes, del mas nuevo al mas viejo, para el formulario
 * de alta de informes.
 */
export function periodosRecientes(tipo: TipoPeriodo, cantidad = 12): Periodo[] {
  const periodos: Periodo[] = [];
  let actual = calcularPeriodo(tipo, hoyEnAsuncion());

  for (let indice = 0; indice < cantidad; indice += 1) {
    periodos.push(actual);
    actual = periodoAnterior(tipo, actual.inicio);
  }

  return periodos;
}

/**
 * Rotulo legible del periodo.
 *
 * Mensual: "Agosto 2026".
 * Quincenal: "1.a quincena de agosto 2026" / "2.a quincena de agosto 2026".
 */
export function rotularPeriodo(tipo: TipoPeriodo, inicio: string): string {
  const { anio, mes, dia } = descomponerFecha(inicio);
  const nombreMes = NOMBRES_MES[mes - 1] ?? '';

  if (tipo === 'mensual') {
    return `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${anio}`;
  }

  const numeroQuincena = dia <= 15 ? '1.a' : '2.a';
  return `${numeroQuincena} quincena de ${nombreMes} ${anio}`;
}

/** Rotulo corto para listas densas: "16/08 – 31/08/2026". */
export function rotularRango(inicio: string, fin: string): string {
  const desde = descomponerFecha(inicio);
  const hasta = descomponerFecha(fin);
  const dosDigitos = (numero: number) => String(numero).padStart(2, '0');

  return `${dosDigitos(desde.dia)}/${dosDigitos(desde.mes)} – ${dosDigitos(hasta.dia)}/${dosDigitos(hasta.mes)}/${hasta.anio}`;
}

/** Valida que la cadena tenga forma de fecha y exista en el calendario. */
export function esFechaValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const { anio, mes, dia } = descomponerFecha(valor);
  if (mes < 1 || mes > 12) return false;
  return dia >= 1 && dia <= ultimoDiaDelMes(anio, mes);
}
