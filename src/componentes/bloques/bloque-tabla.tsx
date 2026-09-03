import type { ContenidoTabla } from '@/lib/bloques';
import { formatearValor } from '@/lib/formato';
import { clases } from '@/lib/utilidades';

const POR_ALINEACION = {
  izquierda: 'text-start',
  centro: 'text-center',
  derecha: 'text-end',
} as const;

export function BloqueTabla({ contenido }: { contenido: ContenidoTabla }) {
  const columnas = contenido.columnas ?? [];
  const filas = contenido.filas ?? [];

  if (columnas.length === 0) {
    return <p className="text-xs text-atenuado">Este cuadro no tiene columnas definidas.</p>;
  }

  return (
    <div>
      {/* El cuadro se desplaza dentro de su propio contenedor: el cuerpo de la
          pagina nunca se desplaza en horizontal. */}
      <div className="desplazamiento-fino -mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-borde">
              {columnas.map((columna) => (
                <th
                  key={columna.clave}
                  scope="col"
                  className={clases(
                    'whitespace-nowrap px-2 py-1.5 font-medium uppercase tracking-wide text-atenuado first:ps-0 last:pe-0',
                    POR_ALINEACION[columna.alineacion ?? 'izquierda'],
                  )}
                >
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-2 py-3 text-center text-atenuado">
                  Sin filas cargadas.
                </td>
              </tr>
            ) : (
              filas.map((fila, indice) => (
                <tr key={indice} className="hover:bg-superficie">
                  {columnas.map((columna) => (
                    <td
                      key={columna.clave}
                      className={clases(
                        'px-2 py-1.5 tabular-nums text-texto first:ps-0 last:pe-0',
                        POR_ALINEACION[columna.alineacion ?? 'izquierda'],
                      )}
                    >
                      {formatearValor(fila[columna.clave], columna.formato ?? 'texto', columna.decimales)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {contenido.nota !== undefined && contenido.nota !== '' ? (
        <p className="mt-2 text-micro text-atenuado">{contenido.nota}</p>
      ) : null}
    </div>
  );
}
