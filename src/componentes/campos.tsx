import type { ComponentProps, ReactNode } from 'react';

import { clases } from '@/lib/utilidades';

const CLASES_CONTROL = clases(
  'w-full rounded-md border border-borde bg-fondo px-2.5 py-1.5 text-sm text-texto',
  'placeholder:text-atenuado/70 disabled:cursor-not-allowed disabled:opacity-60',
);

export function Etiquetado({
  etiqueta,
  ayuda,
  children,
  className,
}: {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clases('block', className)}>
      <span className="mb-1 block text-xs font-medium text-atenuado">{etiqueta}</span>
      {children}
      {ayuda !== undefined ? <span className="mt-1 block text-micro text-atenuado">{ayuda}</span> : null}
    </label>
  );
}

export function CampoTexto({ className, ...resto }: ComponentProps<'input'>) {
  return <input type="text" className={clases(CLASES_CONTROL, className)} {...resto} />;
}

export function AreaTexto({ className, ...resto }: ComponentProps<'textarea'>) {
  return <textarea className={clases(CLASES_CONTROL, 'min-h-24 resize-y', className)} {...resto} />;
}

export function Selector({ className, children, ...resto }: ComponentProps<'select'>) {
  return (
    <select className={clases(CLASES_CONTROL, 'pr-8', className)} {...resto}>
      {children}
    </select>
  );
}

export function Casilla({
  etiqueta,
  className,
  ...resto
}: ComponentProps<'input'> & { etiqueta: ReactNode }) {
  return (
    <label className={clases('flex items-center gap-2 text-sm text-texto', className)}>
      <input
        type="checkbox"
        className="size-4 rounded border-borde bg-fondo text-primario accent-primario"
        {...resto}
      />
      {etiqueta}
    </label>
  );
}
