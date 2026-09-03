'use client';

import { CampoTexto, Etiquetado } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import type { ContenidoEnlaces, EnlaceBloque } from '@/lib/bloques';

const NUEVO: EnlaceBloque = { titulo: '', url: '' };

export function EditorEnlaces({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoEnlaces;
  alCambiar: (contenido: ContenidoEnlaces) => void;
}) {
  const enlaces = contenido.enlaces ?? [];

  function actualizar(indice: number, cambios: Partial<EnlaceBloque>) {
    const actual = enlaces[indice];
    if (actual === undefined) return;
    alCambiar({ enlaces: reemplazar(enlaces, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {enlaces.map((enlace, indice) => (
          <FilaEditable
            key={indice}
            numero={indice + 1}
            puedeEliminar={enlaces.length > 1}
            alEliminar={() => alCambiar({ enlaces: quitar(enlaces, indice) })}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Etiquetado etiqueta="Título">
                <CampoTexto
                  value={enlace.titulo}
                  placeholder="Planilla de pautas"
                  onChange={(evento) => actualizar(indice, { titulo: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Dirección" className="sm:col-span-2">
                <CampoTexto
                  type="url"
                  value={enlace.url}
                  placeholder="https://"
                  onChange={(evento) => actualizar(indice, { url: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Detalle" ayuda="Opcional" className="sm:col-span-3">
                <CampoTexto
                  value={enlace.detalle ?? ''}
                  onChange={(evento) => actualizar(indice, { detalle: evento.target.value })}
                />
              </Etiquetado>
            </div>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ enlaces: [...enlaces, { ...NUEVO }] })}>
        Agregar enlace
      </BotonAgregar>
    </div>
  );
}
