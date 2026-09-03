import type { ReactNode } from 'react';

import { clases } from '@/lib/utilidades';

export function Tarjeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clases('rounded-lg border border-borde bg-elevado', className)}>
      {children}
    </section>
  );
}

export function CabeceraTarjeta({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borde px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-texto">{titulo}</h2>
        {descripcion !== undefined && descripcion !== null && descripcion !== '' ? (
          <p className="mt-0.5 text-xs text-atenuado">{descripcion}</p>
        ) : null}
      </div>
      {acciones !== undefined ? <div className="flex shrink-0 items-center gap-2">{acciones}</div> : null}
    </header>
  );
}

export function CuerpoTarjeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clases('px-4 py-3', className)}>{children}</div>;
}

/** Recuadro para cuando no hay nada que mostrar. */
export function EstadoVacio({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-borde bg-superficie px-4 py-8 text-center">
      <p className="text-sm font-medium text-texto">{titulo}</p>
      {detalle !== undefined ? <p className="mx-auto mt-1 max-w-md text-xs text-atenuado">{detalle}</p> : null}
      {accion !== undefined ? <div className="mt-4 flex justify-center">{accion}</div> : null}
    </div>
  );
}
