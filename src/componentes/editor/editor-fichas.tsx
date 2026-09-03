'use client';

/** Formulario del bloque de fichas. */

import { AreaTexto, CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { BotonAgregar, FilaEditable, quitar, reemplazar } from '@/componentes/editor/utiles-editor';
import {
  ETIQUETAS_TONO,
  TONOS,
  type CampoFicha,
  type ContenidoFichas,
  type EnlaceCorto,
  type Ficha,
  type Tono,
} from '@/lib/bloques';

const FICHA_NUEVA: Ficha = {
  nombre: '',
  rol: '',
  marca: '',
  tono: 'ok',
  estado: 'Activo',
  campos: [],
  materiales: [],
};

export function EditorFichas({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoFichas;
  alCambiar: (contenido: ContenidoFichas) => void;
}) {
  const fichas = contenido.fichas ?? [];

  function cambiarFicha(indice: number, cambios: Partial<Ficha>) {
    const actual = fichas[indice];
    if (actual === undefined) return;
    alCambiar({ ...contenido, fichas: reemplazar(fichas, indice, { ...actual, ...cambios }) });
  }

  return (
    <div className="space-y-3">
      <Etiquetado etiqueta="Introducción" ayuda="Opcional. Aparece arriba de las tarjetas.">
        <AreaTexto
          className="min-h-14"
          value={contenido.introduccion ?? ''}
          onChange={(evento) => alCambiar({ ...contenido, introduccion: evento.target.value })}
        />
      </Etiquetado>

      <ul className="space-y-2">
        {fichas.map((ficha, indice) => {
          const campos = ficha.campos ?? [];
          const materiales = ficha.materiales ?? [];

          function cambiarCampo(posicion: number, cambios: Partial<CampoFicha>) {
            const actual = campos[posicion];
            if (actual === undefined) return;
            cambiarFicha(indice, { campos: reemplazar(campos, posicion, { ...actual, ...cambios }) });
          }

          function cambiarMaterial(posicion: number, cambios: Partial<EnlaceCorto>) {
            const actual = materiales[posicion];
            if (actual === undefined) return;
            cambiarFicha(indice, {
              materiales: reemplazar(materiales, posicion, { ...actual, ...cambios }),
            });
          }

          return (
            <FilaEditable
              key={indice}
              numero={indice + 1}
              puedeEliminar={fichas.length > 1}
              alEliminar={() => alCambiar({ ...contenido, fichas: quitar(fichas, indice) })}
            >
              <div className="grid gap-2 sm:grid-cols-3">
                <Etiquetado etiqueta="Nombre">
                  <CampoTexto
                    value={ficha.nombre}
                    onChange={(evento) => cambiarFicha(indice, { nombre: evento.target.value })}
                  />
                </Etiquetado>
                <Etiquetado etiqueta="Rol">
                  <CampoTexto
                    value={ficha.rol ?? ''}
                    onChange={(evento) => cambiarFicha(indice, { rol: evento.target.value })}
                  />
                </Etiquetado>
                <Etiquetado etiqueta="Marca">
                  <CampoTexto
                    value={ficha.marca ?? ''}
                    onChange={(evento) => cambiarFicha(indice, { marca: evento.target.value })}
                  />
                </Etiquetado>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Etiquetado etiqueta="Texto del chip">
                  <CampoTexto
                    value={ficha.estado}
                    onChange={(evento) => cambiarFicha(indice, { estado: evento.target.value })}
                  />
                </Etiquetado>
                <Etiquetado etiqueta="Color del chip">
                  <Selector
                    value={ficha.tono}
                    onChange={(evento) => cambiarFicha(indice, { tono: evento.target.value as Tono })}
                  >
                    {TONOS.map((tono) => (
                      <option key={tono} value={tono}>
                        {ETIQUETAS_TONO[tono]}
                      </option>
                    ))}
                  </Selector>
                </Etiquetado>
              </div>

              <p className="mt-3 text-micro font-medium uppercase tracking-wide text-atenuado">
                Detalle de la ficha
              </p>
              <ul className="mt-1 space-y-1.5">
                {campos.map((campo, posicion) => (
                  <li key={posicion} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                    <CampoTexto
                      aria-label="Etiqueta"
                      placeholder="Tipo de acuerdo"
                      value={campo.etiqueta}
                      onChange={(evento) => cambiarCampo(posicion, { etiqueta: evento.target.value })}
                    />
                    <CampoTexto
                      aria-label="Valor"
                      placeholder="Contrato firmado el 12/08"
                      value={campo.valor}
                      onChange={(evento) => cambiarCampo(posicion, { valor: evento.target.value })}
                    />
                    <BotonAgregar
                      alAgregar={() => cambiarFicha(indice, { campos: quitar(campos, posicion) })}
                    >
                      Quitar
                    </BotonAgregar>
                  </li>
                ))}
              </ul>
              <div className="mt-1.5">
                <BotonAgregar
                  alAgregar={() => cambiarFicha(indice, { campos: [...campos, { etiqueta: '', valor: '' }] })}
                >
                  Agregar dato
                </BotonAgregar>
              </div>

              <p className="mt-3 text-micro font-medium uppercase tracking-wide text-atenuado">
                Materiales
              </p>
              <ul className="mt-1 space-y-1.5">
                {materiales.map((material, posicion) => (
                  <li key={posicion} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                    <CampoTexto
                      aria-label="Título del material"
                      placeholder="Contenido publicado en IG"
                      value={material.titulo}
                      onChange={(evento) => cambiarMaterial(posicion, { titulo: evento.target.value })}
                    />
                    <CampoTexto
                      aria-label="Dirección del material"
                      placeholder="https://..."
                      value={material.url}
                      onChange={(evento) => cambiarMaterial(posicion, { url: evento.target.value })}
                    />
                    <BotonAgregar
                      alAgregar={() => cambiarFicha(indice, { materiales: quitar(materiales, posicion) })}
                    >
                      Quitar
                    </BotonAgregar>
                  </li>
                ))}
              </ul>
              <div className="mt-1.5">
                <BotonAgregar
                  alAgregar={() =>
                    cambiarFicha(indice, { materiales: [...materiales, { titulo: '', url: '' }] })
                  }
                >
                  Agregar material
                </BotonAgregar>
              </div>
            </FilaEditable>
          );
        })}
      </ul>

      <BotonAgregar alAgregar={() => alCambiar({ ...contenido, fichas: [...fichas, { ...FICHA_NUEVA }] })}>
        Agregar ficha
      </BotonAgregar>
    </div>
  );
}
