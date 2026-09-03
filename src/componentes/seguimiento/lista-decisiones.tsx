import { CLASES_POR_TONO, Etiqueta } from '@/componentes/etiqueta';
import type { DecisionSeguida } from '@/lib/seguimiento';
import { formatearFecha } from '@/lib/formato';
import { clases } from '@/lib/utilidades';

/**
 * Decisiones que se arrastran de una reunion a otra.
 *
 * Lo que aporta esta lista no es el detalle de cada punto, que ya esta en su
 * informe: es cuantas reuniones lleva sin resolverse. Un pendiente que aparece
 * por cuarta vez no se lee igual que uno nuevo.
 */
export function ListaDecisiones({ decisiones }: { decisiones: DecisionSeguida[] }) {
  if (decisiones.length === 0) {
    return (
      <p className="text-xs text-atenuado">
        No hay decisiones pendientes registradas en las reuniones de este período.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {decisiones.map((decision) => (
        <li
          key={decision.titulo}
          className={clases(
            'flex flex-wrap items-start gap-x-2.5 gap-y-1 rounded-md border px-3 py-2',
            decision.sigueAbierta ? 'border-borde bg-superficie' : 'border-borde/60 bg-transparent',
          )}
        >
          <span className="shrink-0 pt-0.5">
            <Etiqueta className={CLASES_POR_TONO[decision.tono]}>{decision.etiqueta}</Etiqueta>
          </span>

          <div className="min-w-0 flex-1">
            <p
              className={clases(
                'text-sm leading-snug',
                decision.sigueAbierta ? 'text-texto' : 'text-atenuado',
              )}
            >
              {decision.titulo}
            </p>
            {decision.detalle !== '' ? (
              <p className="mt-0.5 text-xs leading-relaxed text-atenuado">{decision.detalle}</p>
            ) : null}
          </div>

          <div className="shrink-0 text-end">
            <p className="text-micro font-medium text-texto">
              {decision.reuniones} {decision.reuniones === 1 ? 'reunión' : 'reuniones'}
            </p>
            <p className="text-micro text-atenuado">
              Desde el {formatearFecha(decision.desde)}
              {decision.sigueAbierta ? '' : ` · última vez el ${formatearFecha(decision.hasta)}`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
