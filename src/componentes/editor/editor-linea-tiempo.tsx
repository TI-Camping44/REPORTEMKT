'use client';

/** Formulario del bloque de línea de tiempo. */

import { CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ESTADOS_PASO,
  ETIQUETAS_ESTADO_PASO,
  type ContenidoLineaTiempo,
  type EstadoPaso,
  type PasoLineaTiempo,
} from '@/lib/bloques';

const PASO_NUEVO: PasoLineaTiempo = { fecha: '', titulo: '', estado: 'proximo' };

export function EditorLineaTiempo({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoLineaTiempo;
  alCambiar: (contenido: ContenidoLineaTiempo) => void;
}) {
  const pasos = contenido.pasos ?? [];

  function cambiarPaso(indice: number, cambios: Partial<PasoLineaTiempo>) {
    const actual = pasos[indice];
    if (actual === undefined) return;
    alCambiar({ pasos: reemplazar(pasos, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {pasos.map((paso, indice) => (
          <FilaEditable
            key={indice}
            numero={indice + 1}
            puedeEliminar={pasos.length > 1}
            alEliminar={() => alCambiar({ pasos: quitar(pasos, indice) })}
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
              <Etiquetado etiqueta="Fecha" ayuda="Texto libre: «07/08», «Sept–Oct».">
                <CampoTexto
                  value={paso.fecha}
                  onChange={(evento) => cambiarPaso(indice, { fecha: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Paso">
                <CampoTexto
                  value={paso.titulo}
                  onChange={(evento) => cambiarPaso(indice, { titulo: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Estado">
                <Selector
                  value={paso.estado}
                  onChange={(evento) => cambiarPaso(indice, { estado: evento.target.value as EstadoPaso })}
                >
                  {ESTADOS_PASO.map((estado) => (
                    <option key={estado} value={estado}>
                      {ETIQUETAS_ESTADO_PASO[estado]}
                    </option>
                  ))}
                </Selector>
              </Etiquetado>
            </div>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ pasos: [...pasos, { ...PASO_NUEVO }] })}>
        Agregar paso
      </BotonAgregar>
    </div>
  );
}
