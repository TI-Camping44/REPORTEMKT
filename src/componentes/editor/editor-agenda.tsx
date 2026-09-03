'use client';

/** Formulario del bloque de agenda. */

import { AreaTexto, CampoTexto, Casilla, Etiquetado } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import type { ContenidoAgenda, PuntoAgenda } from '@/lib/bloques';

const PUNTO_NUEVO: PuntoAgenda = { texto: '', origen: '', tratado: false };

export function EditorAgenda({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoAgenda;
  alCambiar: (contenido: ContenidoAgenda) => void;
}) {
  const puntos = contenido.puntos ?? [];

  function cambiarPunto(indice: number, cambios: Partial<PuntoAgenda>) {
    const actual = puntos[indice];
    if (actual === undefined) return;
    alCambiar({ ...contenido, puntos: reemplazar(puntos, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <Etiquetado
        etiqueta="Introducción"
        ayuda="Opcional. De dónde salen los temas: «Según minuta de la reunión 23/07»."
      >
        <AreaTexto
          className="min-h-16"
          value={contenido.introduccion ?? ''}
          onChange={(evento) => alCambiar({ ...contenido, introduccion: evento.target.value })}
        />
      </Etiquetado>

      <ul className="space-y-2">
        {puntos.map((punto, indice) => (
          <FilaEditable
            key={indice}
            numero={indice + 1}
            puedeEliminar={puntos.length > 1}
            alEliminar={() => alCambiar({ ...contenido, puntos: quitar(puntos, indice) })}
          >
            <Etiquetado etiqueta="Tema">
              <AreaTexto
                className="min-h-16"
                value={punto.texto}
                onChange={(evento) => cambiarPunto(indice, { texto: evento.target.value })}
              />
            </Etiquetado>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Etiquetado etiqueta="Origen" ayuda="«Minuta 23/07», «Pedido de Dirección», «Informativo».">
                <CampoTexto
                  value={punto.origen ?? ''}
                  onChange={(evento) => cambiarPunto(indice, { origen: evento.target.value })}
                />
              </Etiquetado>

              <div className="flex items-end pb-1.5">
                <Casilla
                  etiqueta="Ya se trató"
                  checked={punto.tratado}
                  onChange={(evento) => cambiarPunto(indice, { tratado: evento.target.checked })}
                />
              </div>
            </div>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar
        alAgregar={() => alCambiar({ ...contenido, puntos: [...puntos, { ...PUNTO_NUEVO }] })}
      >
        Agregar tema
      </BotonAgregar>
    </div>
  );
}
