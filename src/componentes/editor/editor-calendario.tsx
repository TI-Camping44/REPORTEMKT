'use client';

/** Formulario del bloque de calendario. */

import { CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ETIQUETAS_TIPO_EVENTO,
  TIPOS_EVENTO,
  type ContenidoCalendario,
  type EventoCalendario,
  type ProximoCalendario,
  type TipoEvento,
} from '@/lib/bloques';

const EVENTO_NUEVO: EventoCalendario = { dia: 1, nombre: '', tipo: 'evento' };
const PROXIMO_NUEVO: ProximoCalendario = { fecha: '', nombre: '' };

export function EditorCalendario({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoCalendario;
  alCambiar: (contenido: ContenidoCalendario) => void;
}) {
  const eventos = contenido.eventos ?? [];
  const proximos = contenido.proximos ?? [];

  function cambiarEvento(indice: number, cambios: Partial<EventoCalendario>) {
    const actual = eventos[indice];
    if (actual === undefined) return;
    alCambiar({ ...contenido, eventos: reemplazar(eventos, indice, { ...actual, ...cambios }) });
  }

  function cambiarProximo(indice: number, cambios: Partial<ProximoCalendario>) {
    const actual = proximos[indice];
    if (actual === undefined) return;
    alCambiar({ ...contenido, proximos: reemplazar(proximos, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-4">
      <Etiquetado etiqueta="Mes" ayuda="El mes que se dibuja en la grilla.">
        <CampoTexto
          type="month"
          value={contenido.mes ?? ''}
          onChange={(evento) => alCambiar({ ...contenido, mes: evento.target.value })}
        />
      </Etiquetado>

      <div>
        <p className="mb-2 text-xs font-medium text-atenuado">Eventos del mes</p>
        <ul className="space-y-2">
          {eventos.map((evento, indice) => (
            <FilaEditable
              key={indice}
              numero={indice + 1}
              alEliminar={() => alCambiar({ ...contenido, eventos: quitar(eventos, indice) })}
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(0,4rem)_minmax(0,3fr)_minmax(0,1fr)]">
                <Etiquetado etiqueta="Día">
                  <CampoTexto
                    type="number"
                    min={1}
                    max={31}
                    value={String(evento.dia)}
                    onChange={(campo) => cambiarEvento(indice, { dia: Number(campo.target.value) })}
                  />
                </Etiquetado>

                <Etiquetado etiqueta="Nombre">
                  <CampoTexto
                    value={evento.nombre}
                    onChange={(campo) => cambiarEvento(indice, { nombre: campo.target.value })}
                  />
                </Etiquetado>

                <Etiquetado etiqueta="Tipo">
                  <Selector
                    value={evento.tipo}
                    onChange={(campo) => cambiarEvento(indice, { tipo: campo.target.value as TipoEvento })}
                  >
                    {TIPOS_EVENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {ETIQUETAS_TIPO_EVENTO[tipo]}
                      </option>
                    ))}
                  </Selector>
                </Etiquetado>
              </div>
            </FilaEditable>
          ))}
        </ul>
        <div className="mt-2">
          <BotonAgregar
            alAgregar={() => alCambiar({ ...contenido, eventos: [...eventos, { ...EVENTO_NUEVO }] })}
          >
            Agregar evento
          </BotonAgregar>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-atenuado">
          Próximos
          <span className="ms-1 font-normal">— fuera del mes que se dibuja</span>
        </p>
        <ul className="space-y-2">
          {proximos.map((proximo, indice) => (
            <FilaEditable
              key={indice}
              numero={indice + 1}
              alEliminar={() => alCambiar({ ...contenido, proximos: quitar(proximos, indice) })}
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
                <Etiquetado etiqueta="Fecha" ayuda="Texto libre: «26–28/09».">
                  <CampoTexto
                    value={proximo.fecha}
                    onChange={(campo) => cambiarProximo(indice, { fecha: campo.target.value })}
                  />
                </Etiquetado>

                <Etiquetado etiqueta="Nombre">
                  <CampoTexto
                    value={proximo.nombre}
                    onChange={(campo) => cambiarProximo(indice, { nombre: campo.target.value })}
                  />
                </Etiquetado>
              </div>
            </FilaEditable>
          ))}
        </ul>
        <div className="mt-2">
          <BotonAgregar
            alAgregar={() => alCambiar({ ...contenido, proximos: [...proximos, { ...PROXIMO_NUEVO }] })}
          >
            Agregar próximo
          </BotonAgregar>
        </div>
      </div>
    </div>
  );
}
