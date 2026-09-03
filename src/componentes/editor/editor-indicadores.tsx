'use client';

import { Casilla, CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, aNumeroOpcional, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ETIQUETAS_FORMATO_VALOR,
  FORMATOS_VALOR,
  type ContenidoIndicadores,
  type FormatoValor,
  type Indicador,
} from '@/lib/bloques';

const NUEVO: Indicador = { etiqueta: '', valor: '', formato: 'numero', variacion: null };

export function EditorIndicadores({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoIndicadores;
  alCambiar: (contenido: ContenidoIndicadores) => void;
}) {
  const indicadores = contenido.indicadores ?? [];

  function actualizar(indice: number, cambios: Partial<Indicador>) {
    const actual = indicadores[indice];
    if (actual === undefined) return;
    alCambiar({ indicadores: reemplazar(indicadores, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {indicadores.map((indicador, indice) => (
          <FilaEditable
            key={indice}
            numero={indice + 1}
            puedeEliminar={indicadores.length > 1}
            alEliminar={() => alCambiar({ indicadores: quitar(indicadores, indice) })}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Etiquetado etiqueta="Etiqueta" className="lg:col-span-2">
                <CampoTexto
                  value={indicador.etiqueta}
                  placeholder="Sesiones en el sitio"
                  onChange={(evento) => actualizar(indice, { etiqueta: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Valor">
                <CampoTexto
                  value={indicador.valor}
                  inputMode="decimal"
                  placeholder="18432"
                  onChange={(evento) => actualizar(indice, { valor: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Formato">
                <Selector
                  value={indicador.formato}
                  onChange={(evento) => actualizar(indice, { formato: evento.target.value as FormatoValor })}
                >
                  {FORMATOS_VALOR.map((formato) => (
                    <option key={formato} value={formato}>
                      {ETIQUETAS_FORMATO_VALOR[formato]}
                    </option>
                  ))}
                </Selector>
              </Etiquetado>

              <Etiquetado etiqueta="Variación %" ayuda="Vacío si no corresponde">
                <CampoTexto
                  value={indicador.variacion === null || indicador.variacion === undefined ? '' : String(indicador.variacion)}
                  inputMode="decimal"
                  placeholder="12,4"
                  onChange={(evento) => actualizar(indice, { variacion: aNumeroOpcional(evento.target.value) })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Detalle" className="lg:col-span-2">
                <CampoTexto
                  value={indicador.detalle ?? ''}
                  placeholder="vs. período anterior"
                  onChange={(evento) => actualizar(indice, { detalle: evento.target.value })}
                />
              </Etiquetado>

              <div className="flex items-end">
                <Casilla
                  etiqueta="Bajar es mejor"
                  checked={indicador.mejorSiBaja === true}
                  onChange={(evento) => actualizar(indice, { mejorSiBaja: evento.target.checked })}
                />
              </div>
            </div>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ indicadores: [...indicadores, { ...NUEVO }] })}>
        Agregar indicador
      </BotonAgregar>

      <p className="text-micro leading-relaxed text-atenuado">
        Los montos se escriben sin puntos ni símbolo: la aplicación los muestra como Gs. 3.711.850.
        Marque «Bajar es mejor» en los costos, para que una variación negativa se lea como buena.
      </p>
    </div>
  );
}
