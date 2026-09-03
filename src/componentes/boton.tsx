import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { clases } from '@/lib/utilidades';

export type VarianteBoton = 'primario' | 'secundario' | 'sutil' | 'peligro';
export type TamanoBoton = 'normal' | 'chico';

const POR_VARIANTE: Record<VarianteBoton, string> = {
  primario: 'bg-primario text-white hover:bg-primario/90 border-transparent',
  secundario: 'bg-elevado text-texto hover:bg-superficie border-borde',
  sutil: 'bg-transparent text-atenuado hover:text-texto hover:bg-superficie border-transparent',
  peligro: 'bg-transparent text-peligro hover:bg-peligro/10 border-peligro/40',
};

const POR_TAMANO: Record<TamanoBoton, string> = {
  normal: 'h-9 px-3.5 text-sm',
  chico: 'h-7 px-2.5 text-xs',
};

export function clasesDeBoton(
  variante: VarianteBoton = 'secundario',
  tamano: TamanoBoton = 'normal',
  extra?: string,
): string {
  return clases(
    'inline-flex items-center justify-center gap-1.5 rounded-md border font-medium',
    'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    POR_VARIANTE[variante],
    POR_TAMANO[tamano],
    extra,
  );
}

type PropiedadesBoton = ComponentProps<'button'> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
};

export function Boton({ variante, tamano, className, ...resto }: PropiedadesBoton) {
  return <button className={clasesDeBoton(variante, tamano, className)} {...resto} />;
}

type PropiedadesEnlace = ComponentProps<typeof Link> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  children: ReactNode;
};

export function EnlaceBoton({ variante, tamano, className, ...resto }: PropiedadesEnlace) {
  return <Link className={clasesDeBoton(variante, tamano, className)} {...resto} />;
}
