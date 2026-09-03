'use client';

/**
 * Formulario del bloque de tabla.
 *
 * Las columnas se definen arriba y las filas se cargan abajo. La clave de cada
 * columna es la que conecta las dos partes: al renombrarla hay que renombrarla
 * tambien en todas las filas, o los datos quedan huerfanos y la tabla se
 * muestra vacia sin decir por que.
 */

import { CampoTexto, Casilla, Etiquetado, Selector } from '@/componentes/campos';
import { Boton } from '@/componentes/boton';
import { BotonAgregar, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ALINEACIONES,
  ETIQUETAS_FORMATO_COLUMNA,
  ETIQUETAS_TONO,
  FORMATOS_COLUMNA,
  TONOS,
  type Alineacion,
  type ColumnaTabla,
  type ContenidoTabla,
  type FilaTabla,
  type FormatoColumna,
  type Tono,
} from '@/lib/bloques';

const ETIQUETAS_ALINEACION: Record<Alineacion, string> = {
  izquierda: 'Izquierda',
  centro: 'Centro',
  derecha: 'Derecha',
};

/** Convierte un titulo en una clave apta para SQL y para JSON: sin tildes ni espacios. */
function aClave(titulo: string, usadas: string[]): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const inicial = base === '' ? 'columna' : base;
  let candidata = inicial;
  let sufijo = 2;

  while (usadas.includes(candidata)) {
    candidata = `${inicial}_${sufijo}`;
    sufijo += 1;
  }

  return candidata;
}

export function EditorTabla({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoTabla;
  alCambiar: (contenido: ContenidoTabla) => void;
}) {
  const columnas = contenido.columnas ?? [];
  const filas = contenido.filas ?? [];

  function actualizarColumna(indice: number, cambios: Partial<ColumnaTabla>) {
    const actual = columnas[indice];
    if (actual === undefined) return;

    const siguiente = { ...actual, ...cambios };

    // Si cambio la clave, se renombra en todas las filas para no perder datos.
    if (cambios.clave !== undefined && cambios.clave !== actual.clave) {
      const filasRenombradas = filas.map((fila) => {
        const copia: Record<string, string | number | null> = { ...fila };
        copia[siguiente.clave] = copia[actual.clave] ?? '';
        delete copia[actual.clave];
        return copia;
      });

      alCambiar({ ...contenido, columnas: reemplazar(columnas, indice, siguiente), filas: filasRenombradas });
      return;
    }

    alCambiar({ ...contenido, columnas: reemplazar(columnas, indice, siguiente) });
  }

  function eliminarColumna(indice: number) {
    const columna = columnas[indice];
    if (columna === undefined) return;

    const filasSinColumna = filas.map((fila) => {
      const copia: Record<string, string | number | null> = { ...fila };
      delete copia[columna.clave];
      return copia;
    });

    alCambiar({ ...contenido, columnas: quitar(columnas, indice), filas: filasSinColumna });
  }

  function agregarColumna() {
    const clave = aClave('', columnas.map((columna) => columna.clave));
    alCambiar({
      ...contenido,
      columnas: [...columnas, { clave, titulo: '', alineacion: 'izquierda', formato: 'texto' }],
    });
  }

  function agregarFila() {
    const vacia: Record<string, string | number | null> = {};
    for (const columna of columnas) {
      vacia[columna.clave] = '';
    }
    alCambiar({ ...contenido, filas: [...filas, vacia] });
  }

  function actualizarCelda(indiceFila: number, clave: string, valor: string) {
    const fila = filas[indiceFila];
    if (fila === undefined) return;
    alCambiar({ ...contenido, filas: reemplazar(filas, indiceFila, { ...fila, [clave]: valor }) });
  }

  return (
    <div className="space-y-5">
      <section>
        <h4 className="mb-2 text-micro font-medium uppercase tracking-wide text-atenuado">Columnas</h4>
        <ul className="space-y-2">
          {columnas.map((columna, indice) => (
            <li key={indice} className="rounded-md border border-borde bg-superficie p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Etiquetado etiqueta="Título">
                  <CampoTexto
                    value={columna.titulo}
                    placeholder="Medio"
                    onChange={(evento) => actualizarColumna(indice, { titulo: evento.target.value })}
                  />
                </Etiquetado>

                <Etiquetado etiqueta="Clave" ayuda="Sin tildes ni espacios">
                  <CampoTexto
                    value={columna.clave}
                    onChange={(evento) =>
                      actualizarColumna(indice, {
                        clave: aClave(
                          evento.target.value,
                          columnas.filter((_, posicion) => posicion !== indice).map((otra) => otra.clave),
                        ),
                      })
                    }
                  />
                </Etiquetado>

                <Etiquetado etiqueta="Alineación">
                  <Selector
                    value={columna.alineacion ?? 'izquierda'}
                    onChange={(evento) =>
                      actualizarColumna(indice, { alineacion: evento.target.value as Alineacion })
                    }
                  >
                    {ALINEACIONES.map((alineacion) => (
                      <option key={alineacion} value={alineacion}>
                        {ETIQUETAS_ALINEACION[alineacion]}
                      </option>
                    ))}
                  </Selector>
                </Etiquetado>

                <Etiquetado etiqueta="Formato">
                  <Selector
                    value={columna.formato ?? 'texto'}
                    onChange={(evento) =>
                      actualizarColumna(indice, { formato: evento.target.value as FormatoColumna })
                    }
                  >
                    {FORMATOS_COLUMNA.map((formato) => (
                      <option key={formato} value={formato}>
                        {ETIQUETAS_FORMATO_COLUMNA[formato]}
                      </option>
                    ))}
                  </Selector>
                </Etiquetado>

                <div className="flex items-end">
                  <Boton
                    type="button"
                    variante="peligro"
                    tamano="chico"
                    onClick={() => eliminarColumna(indice)}
                    disabled={columnas.length <= 1}
                    title={columnas.length > 1 ? 'Eliminar la columna' : 'Debe quedar al menos una columna'}
                  >
                    Eliminar columna
                  </Boton>
                </div>
              </div>

              {columna.formato === 'estado' ? (
                <ColoresDeEstado
                  columna={columna}
                  filas={filas}
                  alCambiar={(tonos) => actualizarColumna(indice, { tonos })}
                />
              ) : null}
            </li>
          ))}
        </ul>

        <div className="mt-2">
          <BotonAgregar alAgregar={agregarColumna}>Agregar columna</BotonAgregar>
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-micro font-medium uppercase tracking-wide text-atenuado">Filas</h4>

        {columnas.length === 0 ? (
          <p className="text-xs text-atenuado">Defina al menos una columna antes de cargar filas.</p>
        ) : (
          <div className="desplazamiento-fino overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-borde">
                  {columnas.map((columna) => (
                    <th
                      key={columna.clave}
                      scope="col"
                      className="whitespace-nowrap px-2 py-1.5 text-start font-medium uppercase tracking-wide text-atenuado"
                    >
                      {columna.titulo !== '' ? columna.titulo : columna.clave}
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-1.5">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, indiceFila) => (
                  <tr key={indiceFila}>
                    {columnas.map((columna) => (
                      <td key={columna.clave} className="px-1 py-1">
                        <CampoTexto
                          aria-label={`${columna.titulo !== '' ? columna.titulo : columna.clave}, fila ${indiceFila + 1}`}
                          className="min-w-32 py-1 text-xs"
                          value={String(fila[columna.clave] ?? '')}
                          onChange={(evento) => actualizarCelda(indiceFila, columna.clave, evento.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1 text-end">
                      <Boton
                        type="button"
                        variante="peligro"
                        tamano="chico"
                        onClick={() => alCambiar({ ...contenido, filas: quitar(filas, indiceFila) })}
                      >
                        Quitar
                      </Boton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-2">
          <BotonAgregar alAgregar={agregarFila}>Agregar fila</BotonAgregar>
        </div>
      </section>

      <section>
        <Casilla
          etiqueta="Mostrar fila de totales"
          checked={contenido.total !== null && contenido.total !== undefined}
          onChange={(evento) => {
            if (!evento.target.checked) {
              alCambiar({ ...contenido, total: null });
              return;
            }
            const vacia: FilaTabla = {};
            for (const columna of columnas) vacia[columna.clave] = '';
            alCambiar({ ...contenido, total: vacia });
          }}
        />

        {contenido.total !== null && contenido.total !== undefined ? (
          <>
            <p className="mt-1 text-micro text-atenuado">
              El total se escribe a mano: la aplicación no suma por su cuenta, para que el cuadro
              coincida siempre con la planilla de la que sale.
            </p>
            <div className="desplazamiento-fino mt-2 overflow-x-auto">
              <div className="flex min-w-max gap-2">
                {columnas.map((columna) => (
                  <div key={columna.clave} className="w-40">
                    <CampoTexto
                      aria-label={`Total de ${columna.titulo !== '' ? columna.titulo : columna.clave}`}
                      className="py-1 text-xs"
                      placeholder={columna.titulo !== '' ? columna.titulo : columna.clave}
                      value={String(contenido.total?.[columna.clave] ?? '')}
                      onChange={(evento) =>
                        alCambiar({
                          ...contenido,
                          total: { ...(contenido.total ?? {}), [columna.clave]: evento.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <Etiquetado etiqueta="Nota al pie" ayuda="Opcional. Aclara de dónde salen los datos del cuadro.">
        <CampoTexto
          value={contenido.nota ?? ''}
          onChange={(evento) => alCambiar({ ...contenido, nota: evento.target.value })}
        />
      </Etiquetado>
    </div>
  );
}

/**
 * Color de cada valor de una columna de estado.
 *
 * Los valores no se escriben aparte: se leen de las filas ya cargadas. Asi no
 * hay forma de que la lista de colores y la de datos se desincronicen.
 */
function ColoresDeEstado({
  columna,
  filas,
  alCambiar,
}: {
  columna: ColumnaTabla;
  filas: FilaTabla[];
  alCambiar: (tonos: Record<string, Tono>) => void;
}) {
  const valores = Array.from(
    new Set(
      filas
        .map((fila) => String(fila[columna.clave] ?? '').trim())
        .filter((valor) => valor !== ''),
    ),
  );

  if (valores.length === 0) {
    return (
      <p className="mt-2 text-micro text-atenuado">
        Cargue las filas y acá va a poder elegir el color de cada estado.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className="mb-1 text-micro font-medium uppercase tracking-wide text-atenuado">
        Color de cada estado
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {valores.map((valor) => (
          <Etiquetado key={valor} etiqueta={valor}>
            <Selector
              value={columna.tonos?.[valor] ?? 'neutro'}
              onChange={(evento) =>
                alCambiar({ ...(columna.tonos ?? {}), [valor]: evento.target.value as Tono })
              }
            >
              {TONOS.map((tono) => (
                <option key={tono} value={tono}>
                  {ETIQUETAS_TONO[tono]}
                </option>
              ))}
            </Selector>
          </Etiquetado>
        ))}
      </div>
    </div>
  );
}
