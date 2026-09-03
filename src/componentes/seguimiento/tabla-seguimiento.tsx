import type { ReunionSeguida, SerieIndicador } from '@/lib/seguimiento';
import { formatearFecha, formatearValor, formatearVariacion } from '@/lib/formato';
import { clases } from '@/lib/utilidades';

function colorDeVariacion(variacion: number, mejorSiBaja: boolean): string {
  if (variacion === 0) return 'text-atenuado';
  const favorable = mejorSiBaja ? variacion < 0 : variacion > 0;
  return favorable ? 'text-exito' : 'text-peligro';
}

/**
 * Un indicador por fila, una reunion por columna.
 *
 * No hay grafico: los graficos los pone Looker. Una tabla densa es ademas mas
 * facil de leer para Direccion, que compara cifras concretas y no tendencias.
 */
export function TablaSeguimiento({
  reuniones,
  indicadores,
}: {
  reuniones: ReunionSeguida[];
  indicadores: SerieIndicador[];
}) {
  return (
    <div className="desplazamiento-fino -mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-max border-collapse text-xs">
        <thead>
          <tr className="border-b border-borde">
            <th
              scope="col"
              className="sticky start-0 bg-fondo px-2 py-1.5 text-start font-medium uppercase tracking-wide text-atenuado"
            >
              Indicador
            </th>
            {reuniones.map((reunion) => (
              <th
                key={reunion.informeId}
                scope="col"
                className="whitespace-nowrap px-2 py-1.5 text-end font-medium uppercase tracking-wide text-atenuado"
                title={reunion.periodoEtiqueta}
              >
                {formatearFecha(reunion.reunionFecha)}
                {reunion.esBorrador ? <span className="ms-1 text-advertencia">·&nbsp;borrador</span> : null}
              </th>
            ))}
            <th
              scope="col"
              className="whitespace-nowrap px-2 py-1.5 text-end font-medium uppercase tracking-wide text-atenuado"
            >
              Variación
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {indicadores.map((serie) => (
            <tr key={serie.etiqueta} className="hover:bg-superficie">
              <th
                scope="row"
                className="sticky start-0 bg-fondo px-2 py-1.5 text-start font-medium text-texto"
              >
                {serie.etiqueta}
              </th>

              {serie.valores.map((valor, indice) => (
                <td
                  key={reuniones[indice]?.informeId ?? indice}
                  className="whitespace-nowrap px-2 py-1.5 text-end tabular-nums text-texto"
                >
                  {valor === null ? (
                    <span className="text-atenuado">—</span>
                  ) : (
                    formatearValor(valor.valor, serie.formato, serie.decimales)
                  )}
                </td>
              ))}

              <td
                className={clases(
                  'whitespace-nowrap px-2 py-1.5 text-end font-medium tabular-nums',
                  serie.variacion === null
                    ? 'text-atenuado'
                    : colorDeVariacion(serie.variacion, serie.mejorSiBaja),
                )}
              >
                {serie.variacion === null ? '—' : formatearVariacion(serie.variacion)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
