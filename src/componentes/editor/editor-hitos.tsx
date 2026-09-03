'use client';

import { AreaTexto, CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ESTADOS_HITO,
  ETIQUETAS_ESTADO_HITO,
  type ContenidoHitos,
  type EstadoHito,
  type Hito,
} from '@/lib/bloques';

const NUEVO: Hito = { titulo: '', estado: 'en_curso' };

export function EditorHitos({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoHitos;
  alCambiar: (contenido: ContenidoHitos) => void;
}) {
  const hitos = contenido.hitos ?? [];

  function actualizar(indice: number, cambios: Partial<Hito>) {
    const actual = hitos[indice];
    if (actual === undefined) return;
    alCambiar({ hitos: reemplazar(hitos, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {hitos.map((hito, indice) => (
          <FilaEditable
            key={indice}
            numero={indice + 1}
            puedeEliminar={hitos.length > 1}
            alEliminar={() => alCambiar({ hitos: quitar(hitos, indice) })}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Etiquetado etiqueta="Título" className="lg:col-span-2">
                <CampoTexto
                  value={hito.titulo}
                  placeholder="Campaña de temporada alta"
                  onChange={(evento) => actualizar(indice, { titulo: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Estado">
                <Selector
                  value={hito.estado}
                  onChange={(evento) => actualizar(indice, { estado: evento.target.value as EstadoHito })}
                >
                  {ESTADOS_HITO.map((estado) => (
                    <option key={estado} value={estado}>
                      {ETIQUETAS_ESTADO_HITO[estado]}
                    </option>
                  ))}
                </Selector>
              </Etiquetado>

              <Etiquetado etiqueta="Fecha" ayuda="Opcional">
                <CampoTexto
                  type="date"
                  value={hito.fecha ?? ''}
                  onChange={(evento) =>
                    actualizar(indice, { fecha: evento.target.value === '' ? null : evento.target.value })
                  }
                />
              </Etiquetado>

              <Etiquetado etiqueta="Responsable" ayuda="Opcional">
                <CampoTexto
                  value={hito.responsable ?? ''}
                  placeholder="Agencia"
                  onChange={(evento) => actualizar(indice, { responsable: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Detalle" className="lg:col-span-3">
                <AreaTexto
                  className="min-h-16"
                  value={hito.detalle ?? ''}
                  placeholder="Qué se hizo y qué falta"
                  onChange={(evento) => actualizar(indice, { detalle: evento.target.value })}
                />
              </Etiquetado>
            </div>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ hitos: [...hitos, { ...NUEVO }] })}>
        Agregar hito
      </BotonAgregar>
    </div>
  );
}
