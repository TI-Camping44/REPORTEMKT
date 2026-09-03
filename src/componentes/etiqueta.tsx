import type { ReactNode } from 'react';

import { clases } from '@/lib/utilidades';
import {
  ETIQUETAS_ESTADO_INFORME,
  ETIQUETAS_ROL_USUARIO,
  type EstadoInforme,
  type RolUsuario,
} from '@/lib/constantes';
import { ETIQUETAS_ESTADO_HITO, type EstadoHito, type Tono } from '@/lib/bloques';

const BASE = 'inline-flex items-center rounded-full border px-2 py-0.5 text-micro font-medium leading-none';

export function Etiqueta({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clases(BASE, className)}>{children}</span>;
}

/**
 * Colores por tono. Es la unica tabla que traduce tono a color: si el informe
 * necesita un chip nuevo, se escribe su texto y se elige uno de estos seis.
 */
export const CLASES_POR_TONO: Record<Tono, string> = {
  ok: 'border-exito/40 bg-exito/10 text-exito',
  curso: 'border-primario/40 bg-primario/10 text-primario-texto',
  pendiente: 'border-advertencia/40 bg-advertencia/10 text-advertencia',
  riesgo: 'border-peligro/40 bg-peligro/10 text-peligro',
  pausa: 'border-borde bg-superficie text-atenuado',
  neutro: 'border-borde bg-superficie text-atenuado',
};

export function EtiquetaTono({ tono, children }: { tono: Tono; children: ReactNode }) {
  return <Etiqueta className={CLASES_POR_TONO[tono]}>{children}</Etiqueta>;
}

const POR_ESTADO_INFORME: Record<EstadoInforme, string> = {
  borrador: 'border-advertencia/40 bg-advertencia/10 text-advertencia',
  publicado: 'border-exito/40 bg-exito/10 text-exito',
};

export function EtiquetaEstadoInforme({ estado }: { estado: EstadoInforme }) {
  return <Etiqueta className={POR_ESTADO_INFORME[estado]}>{ETIQUETAS_ESTADO_INFORME[estado]}</Etiqueta>;
}

const POR_ESTADO_HITO: Record<EstadoHito, Tono> = {
  pendiente: 'neutro',
  en_curso: 'curso',
  completado: 'ok',
  bloqueado: 'riesgo',
};

export function EtiquetaEstadoHito({ estado }: { estado: EstadoHito }) {
  return <Etiqueta className={CLASES_POR_TONO[POR_ESTADO_HITO[estado]]}>{ETIQUETAS_ESTADO_HITO[estado]}</Etiqueta>;
}

const POR_ROL: Record<RolUsuario, string> = {
  administrador: 'border-primario/40 bg-primario/10 text-primario-texto',
  editor: 'border-borde bg-superficie text-texto',
  lector: 'border-borde bg-superficie text-atenuado',
};

export function EtiquetaRol({ rol }: { rol: RolUsuario }) {
  return <Etiqueta className={POR_ROL[rol]}>{ETIQUETAS_ROL_USUARIO[rol]}</Etiqueta>;
}
