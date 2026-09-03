'use client';

/** Barra de acciones del informe, encabezado y lista de secciones en edicion. */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Etiquetado } from '@/componentes/campos';
import { EditorEncabezado } from '@/componentes/editor/editor-encabezado';
import { EditorSeccion } from '@/componentes/editor/editor-seccion';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { cambiarEstadoDelInforme, eliminarInforme } from '@/acciones/informes';
import { agregarSeccion } from '@/acciones/secciones';
import type { InformeCompleto } from '@/lib/tipos';

export function EditorInforme({
  informe,
  empresaSlug,
}: {
  informe: InformeCompleto;
  empresaSlug: string;
}) {
  const router = useRouter();
  const [mensaje, establecerMensaje] = useState<string | null>(null);
  const [tituloNuevo, establecerTituloNuevo] = useState('');
  const [etiquetaNueva, establecerEtiquetaNueva] = useState('');

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
              accion={() => cambiarEstadoDelInforme({ informeId: informe.id, estado: 'publicado' })}
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
              accion={() => cambiarEstadoDelInforme({ informeId: informe.id, estado: 'borrador' })}
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
            accion={() => eliminarInforme({ informeId: informe.id, slugEmpresa: empresaSlug })}
            etiquetaCargando="Eliminando…"
            variante="peligro"
            confirmacion="¿Eliminar este informe con todas sus secciones y bloques? No se puede deshacer."
          >
            Eliminar informe
          </BotonAccion>
        </div>
      </div>

      {mensaje !== null ? <Aviso tono="exito">{mensaje}</Aviso> : null}

      <EditorEncabezado informe={informe} />

      {informe.secciones.map((seccion, indice) => (
        <EditorSeccion
          key={seccion.id}
          seccion={seccion}
          esPrimera={indice === 0}
          esUltima={indice === informe.secciones.length - 1}
        />
      ))}

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Agregar una sección"
          descripcion="Cada sección es una pestaña arriba del informe."
        />
        <CuerpoTarjeta>
          <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto]">
            <Etiquetado etiqueta="Título">
              <CampoTexto
                value={tituloNuevo}
                placeholder="Proyectos"
                onChange={(evento) => establecerTituloNuevo(evento.target.value)}
              />
            </Etiquetado>

            <Etiquetado etiqueta="Etiqueta" ayuda="Opcional: «Outdoor · Defensa».">
              <CampoTexto
                value={etiquetaNueva}
                onChange={(evento) => establecerEtiquetaNueva(evento.target.value)}
              />
            </Etiquetado>

            <BotonAccion
              accion={() =>
                agregarSeccion({
                  informeId: informe.id,
                  titulo: tituloNuevo,
                  etiqueta: etiquetaNueva,
                })
              }
              etiquetaCargando="Agregando…"
              alTerminar={(resultado) => {
                if (resultado.exito) {
                  establecerTituloNuevo('');
                  establecerEtiquetaNueva('');
                  router.refresh();
                }
              }}
            >
              Agregar sección
            </BotonAccion>
          </div>
        </CuerpoTarjeta>
      </Tarjeta>
    </div>
  );
}
