'use client';

import { AreaTexto, CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ETIQUETAS_NIVEL_ALERTA,
  NIVELES_ALERTA,
  type Alerta,
  type ContenidoAlertas,
  type NivelAlerta,
} from '@/lib/bloques';

const NUEVA: Alerta = { nivel: 'advertencia', titulo: '' };

export function EditorAlertas({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoAlertas;
  alCambiar: (contenido: ContenidoAlertas) => void;
}) {
  const alertas = contenido.alertas ?? [];

  function actualizar(indice: number, cambios: Partial<Alerta>) {
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
            <div className="grid gap-3 sm:grid-cols-4">
              <Etiquetado etiqueta="Nivel">
                <Selector
                  value={alerta.nivel}
                  onChange={(evento) => actualizar(indice, { nivel: evento.target.value as NivelAlerta })}
                >
                  {NIVELES_ALERTA.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {ETIQUETAS_NIVEL_ALERTA[nivel]}
                    </option>
                  ))}
                </Selector>
              </Etiquetado>

              <Etiquetado etiqueta="Título" className="sm:col-span-3">
                <CampoTexto
                  value={alerta.titulo}
                  placeholder="Presupuesto de pauta sin aprobar"
                  onChange={(evento) => actualizar(indice, { titulo: evento.target.value })}
                />
              </Etiquetado>

              <Etiquetado etiqueta="Detalle" className="sm:col-span-4">
                <AreaTexto
                  className="min-h-16"
                  value={alerta.detalle ?? ''}
                  placeholder="Qué se necesita y desde cuándo está pendiente"
                  onChange={(evento) => actualizar(indice, { detalle: evento.target.value })}
                />
              </Etiquetado>
            </div>
          </FilaEditable>
        ))}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ alertas: [...alertas, { ...NUEVA }] })}>
        Agregar alerta
      </BotonAgregar>
    </div>
  );
}
