'use client';

/** Barra de acciones del informe y lista de bloques en edicion. */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { Selector } from '@/componentes/campos';
import { EditorBloque } from '@/componentes/editor/editor-bloque';
import { EstadoVacio } from '@/componentes/tarjeta';
import { agregarBloque } from '@/acciones/bloques';
import { eliminarInforme, publicarInforme, volverInformeABorrador } from '@/acciones/informes';
import {
  DESCRIPCIONES_TIPO_BLOQUE,
  ETIQUETAS_TIPO_BLOQUE,
  TIPOS_BLOQUE,
  type TipoBloque,
} from '@/lib/bloques';
import type { Bloque, Informe } from '@/lib/tipos';

export function EditorInforme({
  informe,
  bloques,
  empresaSlug,
}: {
  informe: Informe;
  bloques: Bloque[];
  empresaSlug: string;
}) {
  const router = useRouter();
  const [tipoNuevo, establecerTipoNuevo] = useState<TipoBloque>('indicadores');
  const [mensaje, establecerMensaje] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-borde bg-elevado px-4 py-3">
        <div>
          <p className="text-xs font-medium text-texto">
            {informe.estado === 'publicado' ? 'Informe publicado' : 'Borrador'}
          </p>
          <p className="mt-0.5 max-w-prose text-micro leading-relaxed text-atenuado">
            {informe.estado === 'publicado'
              ? 'Este informe ya es la foto de su período. Si hay que corregirlo, devuélvalo a borrador, edite y vuelva a publicar.'
              : 'Mientras esté en borrador, Dirección lo ve marcado como tal. Publíquelo cuando el contenido esté completo.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {informe.estado === 'borrador' ? (
            <BotonAccion
              accion={() => publicarInforme(informe.id)}
              etiquetaCargando="Publicando…"
              variante="primario"
              alTerminar={(resultado) => {
                if (resultado.exito) {
                  establecerMensaje(resultado.mensaje ?? 'Informe publicado.');
                  router.refresh();
                }
              }}
            >
              Publicar
            </BotonAccion>
          ) : (
            <BotonAccion
              accion={() => volverInformeABorrador(informe.id)}
              etiquetaCargando="Cambiando…"
              confirmacion="¿Devolver el informe a borrador? Dirección va a verlo marcado como borrador hasta que lo vuelva a publicar."
              alTerminar={(resultado) => {
                if (resultado.exito) {
                  establecerMensaje(resultado.mensaje ?? 'El informe volvió a borrador.');
                  router.refresh();
                }
              }}
            >
              Volver a borrador
            </BotonAccion>
          )}

          <BotonAccion
            accion={() => eliminarInforme(informe.id)}
            etiquetaCargando="Eliminando…"
            variante="peligro"
            confirmacion="¿Eliminar este informe con todos sus bloques? No se puede deshacer."
            alTerminar={(resultado) => {
              if (resultado.exito) {
                router.push(`/${empresaSlug}/historial`);
              }
            }}
          >
            Eliminar informe
          </BotonAccion>
        </div>
      </div>

      {mensaje !== null ? <Aviso tono="exito">{mensaje}</Aviso> : null}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-borde bg-elevado px-4 py-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-atenuado">Agregar un bloque</span>
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
        </label>

        <BotonAccion
          accion={() => agregarBloque({ informeId: informe.id, tipo: tipoNuevo })}
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

      {bloques.length === 0 ? (
        <EstadoVacio
          titulo="El informe todavía no tiene bloques"
          detalle="Elija un tipo de bloque arriba y agréguelo. Un informe típico abre con indicadores, sigue con hitos y cierra con las decisiones pendientes."
        />
      ) : (
        <div className="space-y-4">
          {bloques.map((bloque, indice) => (
            <EditorBloque
              key={bloque.id}
              bloque={bloque}
              esPrimero={indice === 0}
              esUltimo={indice === bloques.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
