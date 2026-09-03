/**
 * Cifras destacadas con su variacion.
 *
 * No hay ningun grafico: los graficos los pone Looker. Un numero grande con su
 * variacion es texto con formato, no un SVG.
 */

import type { ContenidoIndicadores } from '@/lib/bloques';
import { formatearValor, formatearVariacion } from '@/lib/formato';
import { clases } from '@/lib/utilidades';

function colorDeVariacion(variacion: number, mejorSiBaja: boolean): string {
  if (variacion === 0) return 'text-atenuado';
  const favorable = mejorSiBaja ? variacion < 0 : variacion > 0;
  return favorable ? 'text-exito' : 'text-peligro';
}

export function BloqueIndicadores({ contenido }: { contenido: ContenidoIndicadores }) {
  const indicadores = contenido.indicadores ?? [];

  if (indicadores.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene indicadores cargados.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
      {indicadores.map((indicador, indice) => {
        const variacion = indicador.variacion;
        const tieneVariacion = typeof variacion === 'number' && Number.isFinite(variacion);

        return (
          <div key={`${indicador.etiqueta}-${indice}`} className="min-w-0">
            <p className="truncate text-micro uppercase tracking-wide text-atenuado" title={indicador.etiqueta}>
              {indicador.etiqueta}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-texto">
              {formatearValor(indicador.valor, indicador.formato, indicador.decimales)}
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
              {tieneVariacion ? (
                <span
                  className={clases(
                    'text-xs font-medium tabular-nums',
                    colorDeVariacion(variacion, indicador.mejorSiBaja === true),
                  )}
                >
                  {formatearVariacion(variacion)}
                </span>
              ) : null}
              {indicador.detalle !== undefined && indicador.detalle !== '' ? (
                <span className="text-micro text-atenuado">{indicador.detalle}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
