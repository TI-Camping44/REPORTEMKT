'use client';

/**
 * Origen de los datos de un bloque: cargado a mano o leido de una planilla.
 *
 * Solo se ofrece en los tipos que tienen forma tabular. La agenda, los hitos o
 * las alertas no salen de ninguna planilla: son criterio de Marketing.
 */

import { useState } from 'react';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Casilla, Etiquetado } from '@/componentes/campos';
import {
  actualizarBloqueDesdePlanilla,
  guardarFuenteDelBloque,
  probarRango,
  verPestanasDeLaPlanilla,
} from '@/acciones/planillas';
import { esTipoVinculable } from '@/lib/desde-planilla';
import { formatearFechaHora } from '@/lib/formato';
import type { Bloque } from '@/lib/tipos';

export function EditorFuente({ bloque, informePublicado }: { bloque: Bloque; informePublicado: boolean }) {
  const [vinculado, establecerVinculado] = useState(bloque.fuente === 'planilla');
  const [planilla, establecerPlanilla] = useState(bloque.fuente_planilla_id);
  const [rango, establecerRango] = useState(bloque.fuente_rango);
  const [mensaje, establecerMensaje] = useState<string | null>(null);
  const [aviso, establecerAviso] = useState<string | null>(null);

  if (!esTipoVinculable(bloque.tipo)) return null;

  return (
    <div className="rounded-md border border-borde bg-superficie px-3 py-2.5">
      <Casilla
        etiqueta="Traer el contenido de una planilla de Google"
        checked={vinculado}
        onChange={(evento) => {
          establecerVinculado(evento.target.checked);
          establecerMensaje(null);
        }}
      />

      {!vinculado ? (
        <p className="mt-1 text-micro leading-relaxed text-atenuado">
          El contenido se carga a mano, acá abajo.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            <Etiquetado etiqueta="Planilla" ayuda="Pegue la dirección de la hoja tal como la ve en el navegador.">
              <CampoTexto
                value={planilla}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                onChange={(evento) => establecerPlanilla(evento.target.value)}
              />
            </Etiquetado>

            <Etiquetado etiqueta="Rango" ayuda="Pestaña y celdas.">
              <CampoTexto
                value={rango}
                placeholder="Pautas!A1:E30"
                onChange={(evento) => establecerRango(evento.target.value)}
              />
            </Etiquetado>
          </div>

          <p className="text-micro leading-relaxed text-atenuado">
            {bloque.tipo === 'tabla'
              ? 'La primera fila del rango son los títulos de las columnas. Una fila que empiece con «Total» se toma como fila de totales.'
              : 'La primera fila del rango son los encabezados. Hacen falta «etiqueta» y «valor»; «formato», «decimales», «variación» y «detalle» son opcionales.'}
          </p>

          <p className="text-micro text-atenuado">
            La planilla tiene que ser una hoja de cálculo de Google —no un archivo de Excel subido a
            Drive— y estar compartida como lector con la cuenta de servicio de la aplicación.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <BotonAccion
              accion={() => verPestanasDeLaPlanilla({ planilla })}
              etiquetaCargando="Consultando…"
              tamano="chico"
              alTerminar={(resultado) => {
                establecerAviso(resultado.exito ? resultado.mensaje ?? null : null);
              }}
            >
              Ver pestañas
            </BotonAccion>

            <BotonAccion
              accion={() => probarRango({ bloqueId: bloque.id, planilla, rango })}
              etiquetaCargando="Leyendo…"
              tamano="chico"
              alTerminar={(resultado) => {
                establecerAviso(resultado.exito ? resultado.mensaje ?? null : null);
              }}
            >
              Probar sin guardar
            </BotonAccion>
          </div>

          {aviso !== null ? (
            <Aviso tono="informacion" className="mt-1">
              {aviso}
            </Aviso>
          ) : null}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <BotonAccion
          accion={() => guardarFuenteDelBloque({ bloqueId: bloque.id, vinculado, planilla, rango })}
          etiquetaCargando="Guardando…"
          tamano="chico"
          alTerminar={(resultado) => {
            if (resultado.exito) establecerMensaje(resultado.mensaje ?? 'Origen guardado.');
          }}
        >
          Guardar origen
        </BotonAccion>

        {bloque.fuente === 'planilla' ? (
          <BotonAccion
            accion={() => actualizarBloqueDesdePlanilla({ bloqueId: bloque.id })}
            etiquetaCargando="Leyendo la planilla…"
            variante="primario"
            tamano="chico"
            deshabilitado={informePublicado}
            alTerminar={(resultado) => {
              if (resultado.exito) {
                establecerMensaje(resultado.mensaje ?? 'Contenido actualizado.');
                window.location.reload();
              }
            }}
          >
            Actualizar ahora
          </BotonAccion>
        ) : null}

        {bloque.fuente_actualizada_en !== null ? (
          <span className="text-micro text-atenuado">
            Última lectura: {formatearFechaHora(bloque.fuente_actualizada_en)}
          </span>
        ) : null}
      </div>

      {informePublicado && bloque.fuente === 'planilla' ? (
        <p className="mt-1.5 text-micro leading-relaxed text-atenuado">
          El informe está publicado, así que no se actualiza: es el registro de lo que se presentó.
          Devuélvalo a borrador si necesita traer datos nuevos.
        </p>
      ) : null}

      {bloque.fuente_error !== '' ? (
        <Aviso tono="error" className="mt-2">
          {bloque.fuente_error}
        </Aviso>
      ) : null}

      {mensaje !== null ? (
        <Aviso tono="exito" className="mt-2">
          {mensaje}
        </Aviso>
      ) : null}
    </div>
  );
}
