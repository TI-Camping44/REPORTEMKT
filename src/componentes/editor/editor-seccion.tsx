'use client';

/** Edicion de una seccion del informe y de los bloques que contiene. */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { EditorBloque } from '@/componentes/editor/editor-bloque';
import { agregarBloque } from '@/acciones/bloques';
import { eliminarSeccion, guardarSeccion, moverSeccion } from '@/acciones/secciones';
import {
  DESCRIPCIONES_TIPO_BLOQUE,
  ETIQUETAS_TIPO_BLOQUE,
  TIPOS_BLOQUE,
  type TipoBloque,
} from '@/lib/bloques';
import type { SeccionCompleta } from '@/lib/tipos';

export function EditorSeccion({
  seccion,
  esPrimera,
  esUltima,
  informePublicado,
  planillasDisponibles,
}: {
  seccion: SeccionCompleta;
  esPrimera: boolean;
  esUltima: boolean;
  informePublicado: boolean;
  planillasDisponibles: boolean;
}) {
  const router = useRouter();
  const [titulo, establecerTitulo] = useState(seccion.titulo);
  const [etiqueta, establecerEtiqueta] = useState(seccion.etiqueta);
  const [tipoNuevo, establecerTipoNuevo] = useState<TipoBloque>('indicadores');

  return (
    <Tarjeta className="border-borde/80">
      <CabeceraTarjeta
        titulo={`Sección: ${titulo !== '' ? titulo : 'sin título'}`}
        descripcion={`Ancla #${seccion.clave} · ${seccion.bloques.length} bloque${seccion.bloques.length === 1 ? '' : 's'}`}
        acciones={
          <>
            <BotonAccion
              accion={() => moverSeccion({ seccionId: seccion.id, direccion: 'arriba' })}
              etiquetaCargando="Moviendo…"
              tamano="chico"
              deshabilitado={esPrimera}
              alTerminar={(resultado) => {
                if (resultado.exito) router.refresh();
              }}
            >
              Subir
            </BotonAccion>
            <BotonAccion
              accion={() => moverSeccion({ seccionId: seccion.id, direccion: 'abajo' })}
              etiquetaCargando="Moviendo…"
              tamano="chico"
              deshabilitado={esUltima}
              alTerminar={(resultado) => {
                if (resultado.exito) router.refresh();
              }}
            >
              Bajar
            </BotonAccion>
            <BotonAccion
              accion={() => eliminarSeccion({ seccionId: seccion.id })}
              etiquetaCargando="Eliminando…"
              variante="peligro"
              tamano="chico"
              confirmacion="¿Eliminar esta sección? Se pierden también todos sus bloques."
              alTerminar={(resultado) => {
                if (resultado.exito) router.refresh();
              }}
            >
              Eliminar sección
            </BotonAccion>
          </>
        }
      />

      <CuerpoTarjeta className="space-y-4">
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto]">
          <Etiquetado etiqueta="Título de la pestaña">
            <CampoTexto value={titulo} onChange={(evento) => establecerTitulo(evento.target.value)} />
          </Etiquetado>

          <Etiquetado etiqueta="Etiqueta" ayuda="Opcional: «Outdoor · Defensa».">
            <CampoTexto value={etiqueta} onChange={(evento) => establecerEtiqueta(evento.target.value)} />
          </Etiquetado>

          <BotonAccion
            accion={() => guardarSeccion({ seccionId: seccion.id, titulo, etiqueta })}
            etiquetaCargando="Guardando…"
          >
            Guardar sección
          </BotonAccion>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-md border border-borde bg-superficie px-3 py-2.5">
          <Etiquetado etiqueta="Agregar un bloque a esta sección">
            <Selector
              className="w-auto min-w-48"
              value={tipoNuevo}
              onChange={(evento) => establecerTipoNuevo(evento.target.value as TipoBloque)}
            >
              {TIPOS_BLOQUE.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO_BLOQUE[tipo]}
                </option>
              ))}
            </Selector>
          </Etiquetado>

          <BotonAccion
            accion={() => agregarBloque({ seccionId: seccion.id, tipo: tipoNuevo })}
            etiquetaCargando="Agregando…"
            alTerminar={(resultado) => {
              if (resultado.exito) router.refresh();
            }}
          >
            Agregar
          </BotonAccion>

          <p className="max-w-prose text-micro leading-relaxed text-atenuado">
            {DESCRIPCIONES_TIPO_BLOQUE[tipoNuevo]}
          </p>
        </div>

        {seccion.bloques.length === 0 ? (
          <p className="text-xs text-atenuado">Esta sección todavía no tiene bloques.</p>
        ) : (
          <div className="space-y-3">
            {seccion.bloques.map((bloque, indice) => (
              <EditorBloque
                key={bloque.id}
                bloque={bloque}
                esPrimero={indice === 0}
                esUltimo={indice === seccion.bloques.length - 1}
                informePublicado={informePublicado}
                planillasDisponibles={planillasDisponibles}
              />
            ))}
          </div>
        )}
      </CuerpoTarjeta>
    </Tarjeta>
  );
}
