'use client';

/**
 * Boton que dispara una accion de servidor.
 *
 * Mientras la accion corre muestra su propia etiqueta de avance. Nunca se
 * limita a poner el boton en disabled: un boton apagado y sin senal de avance
 * se lee como roto y la persona vuelve a hacer clic.
 */

import { useState, useTransition, type ReactNode } from 'react';

import { Boton, type TamanoBoton, type VarianteBoton } from '@/componentes/boton';
import type { ResultadoAccion } from '@/lib/tipos';

export function BotonAccion({
  accion,
  children,
  etiquetaCargando = 'Guardando…',
  variante = 'secundario',
  tamano = 'normal',
  confirmacion,
  alTerminar,
  className,
  deshabilitado = false,
}: {
  accion: () => Promise<ResultadoAccion>;
  children: ReactNode;
  etiquetaCargando?: string;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  /** Cuando esta presente se pide confirmacion antes de ejecutar. */
  confirmacion?: string;
  alTerminar?: (resultado: ResultadoAccion) => void;
  className?: string;
  deshabilitado?: boolean;
}) {
  const [enCurso, iniciarTransicion] = useTransition();
  const [error, establecerError] = useState<string | null>(null);

  function ejecutar() {
    if (confirmacion !== undefined && !window.confirm(confirmacion)) return;

    establecerError(null);
    iniciarTransicion(async () => {
      const resultado = await accion();
      if (!resultado.exito) {
        establecerError(resultado.error);
      }
      alTerminar?.(resultado);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Boton
        type="button"
        variante={variante}
        tamano={tamano}
        className={className}
        onClick={ejecutar}
        disabled={deshabilitado || enCurso}
        aria-busy={enCurso}
      >
        {enCurso ? (
          <>
            <Girador />
            {etiquetaCargando}
          </>
        ) : (
          children
        )}
      </Boton>
      {error !== null ? (
        <span role="alert" className="max-w-xs text-micro text-peligro">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export function Girador() {
  return (
    <span
      aria-hidden="true"
      className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
