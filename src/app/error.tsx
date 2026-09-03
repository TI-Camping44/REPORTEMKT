'use client';

import { useEffect } from 'react';

import { Boton } from '@/componentes/boton';
import { NOMBRE_APLICACION } from '@/lib/constantes';

/**
 * Pantalla de error.
 *
 * No muestra el error crudo: el detalle tecnico queda en los registros del
 * servidor, donde TI puede leerlo.
 */
export default function PaginaDeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en REPORTEMKT:', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm bg-primario" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">{NOMBRE_APLICACION}</span>
        </div>

        <div className="rounded-lg border border-borde bg-elevado p-6">
          <h1 className="text-lg font-semibold tracking-tight">Algo falló al cargar la pantalla</h1>
          <p className="mt-2 text-sm leading-relaxed text-atenuado">
            Vuelva a intentarlo. Si el problema sigue, avise a TI indicando qué estaba haciendo
            {error.digest !== undefined ? ` y este código: ${error.digest}` : ''}.
          </p>
          <Boton variante="secundario" className="mt-5" onClick={() => reset()}>
            Volver a intentar
          </Boton>
        </div>
      </div>
    </main>
  );
}
