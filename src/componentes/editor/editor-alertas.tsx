'use client';

/** Formulario del bloque de estado y alertas. */

import { AreaTexto, CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import { ETIQUETAS_TONO, TONOS, type Alerta, type ContenidoAlertas, type Tono } from '@/lib/bloques';

const ALERTA_NUEVA: Alerta = { tono: 'pendiente', etiqueta: 'Pendiente', titulo: '', detalle: '' };

export function EditorAlertas({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoAlertas;
  alCambiar: (contenido: ContenidoAlertas) => void;
}) {
  const alertas = contenido.alertas ?? [];

  function cambiarAlerta(indice: number, cambios: Partial<Alerta>) {
    const actual = alertas[indice];
    if (actual === undefined) return;
    alCambiar({ alertas: reemplazar(alertas, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {alertas.map((alerta, indice) => (
          <FilaEditable
            key={indice}
            numero={indice + 1}
            puedeEliminar={alertas.length > 1}
            alEliminar={() => alCambiar({ alertas: quitar(alertas, indice) })}
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Etiquetado etiqueta="Texto del chip" ayuda="«Aprobada», «Decidir ya», «Pausado».">
                <CampoTexto
                  value={alerta.etiqueta}
                  onChange={(evento) => cambiarAlerta(indice, { etiqueta: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Color del chip">
                <Selector
                  value={alerta.tono}
                  onChange={(evento) => cambiarAlerta(indice, { tono: evento.target.value as Tono })}
                >
                  {TONOS.map((tono) => (
                    <option key={tono} value={tono}>
                      {ETIQUETAS_TONO[tono]}
                    </option>
                  ))}
                </Selector>
              </Etiquetado>
            </div>

            <Etiquetado etiqueta="Título" className="mt-2">
              <CampoTexto
                value={alerta.titulo}
                onChange={(evento) => cambiarAlerta(indice, { titulo: evento.target.value })}
              />
            </Etiquetado>

            <Etiquetado etiqueta="Detalle" className="mt-2">
              <AreaTexto
                className="min-h-16"
                value={alerta.detalle ?? ''}
                onChange={(evento) => cambiarAlerta(indice, { detalle: evento.target.value })}
              />
            </Etiquetado>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ alertas: [...alertas, { ...ALERTA_NUEVA }] })}>
        Agregar punto
      </BotonAgregar>
    </div>
  );
}
