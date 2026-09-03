import { CLASES_POR_TONO, Etiqueta } from '@/componentes/etiqueta';
import type { ColumnaTabla, ContenidoTabla, FilaTabla } from '@/lib/bloques';
import { formatearValor } from '@/lib/formato';
import { clases } from '@/lib/utilidades';

const POR_ALINEACION = {
  izquierda: 'text-start',
  centro: 'text-center',
  derecha: 'text-end',
} as const;

function Celda({ columna, fila }: { columna: ColumnaTabla; fila: FilaTabla }) {
  const valor = fila[columna.clave];

  if (columna.formato === 'estado') {
    const texto = valor === null || valor === undefined || valor === '' ? '' : String(valor);
    if (texto === '') return <span className="text-atenuado">—</span>;
    const tono = columna.tonos?.[texto] ?? 'neutro';
    return <Etiqueta className={CLASES_POR_TONO[tono]}>{texto}</Etiqueta>;
  }

  return <>{formatearValor(valor, columna.formato ?? 'texto', columna.decimales)}</>;
}

export function BloqueTabla({ contenido }: { contenido: ContenidoTabla }) {
  const columnas = contenido.columnas ?? [];
  const filas = contenido.filas ?? [];
  const total = contenido.total ?? null;

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
                      <Celda columna={columna} fila={fila} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {total !== null ? (
            <tfoot>
              <tr className="border-t-2 border-borde font-semibold">
                {columnas.map((columna) => (
                  <td
                    key={columna.clave}
                    className={clases(
                      'px-2 py-1.5 tabular-nums text-texto first:ps-0 last:pe-0',
                      POR_ALINEACION[columna.alineacion ?? 'izquierda'],
                    )}
                  >
                    <Celda columna={columna} fila={total} />
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {contenido.nota !== undefined && contenido.nota !== '' ? (
        <p className="mt-2 text-micro leading-relaxed text-atenuado">{contenido.nota}</p>
      ) : null}
    </div>
  );
}
