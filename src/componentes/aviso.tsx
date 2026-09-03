import type { ReactNode } from 'react';

import { clases } from '@/lib/utilidades';

export type TonoAviso = 'informacion' | 'advertencia' | 'error' | 'exito';

const POR_TONO: Record<TonoAviso, string> = {
  informacion: 'border-borde bg-superficie text-texto',
  advertencia: 'border-advertencia/40 bg-advertencia/10 text-advertencia',
  error: 'border-peligro/40 bg-peligro/10 text-peligro',
  exito: 'border-exito/40 bg-exito/10 text-exito',
};

export function Aviso({
  tono = 'informacion',
  titulo,
  children,
  className,
}: {
  tono?: TonoAviso;
  titulo?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={clases('rounded-md border px-3 py-2 text-xs', POR_TONO[tono], className)}
    >
      {titulo !== undefined ? <p className="font-semibold">{titulo}</p> : null}
      {children !== undefined ? <div className={titulo !== undefined ? 'mt-0.5' : ''}>{children}</div> : null}
    </div>
  );
}
