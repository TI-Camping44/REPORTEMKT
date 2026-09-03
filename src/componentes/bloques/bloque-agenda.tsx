'use client';

/**
 * Temas a tratar en la reunion.
 *
 * Tildar un punto se guarda: es la constancia de que el tema se trato. Solo lo
 * puede hacer quien tiene permiso de edicion, porque escribe en la base;
 * Direccion lo ve marcado, sin casillas.
 *
 * El estado se actualiza en pantalla antes de que responda el servidor y se
 * revierte si la escritura falla. Una casilla que tarda medio segundo en
 * reaccionar es inservible en una reunion.
 */

import { useState, useTransition } from 'react';

import { alternarPuntoDeAgenda } from '@/acciones/bloques';
import { Girador } from '@/componentes/boton-accion';
import type { ContenidoAgenda } from '@/lib/bloques';
import { clases } from '@/lib/utilidades';

export function BloqueAgenda({
  bloqueId,
  contenido,
  puedeEditar,
}: {
  bloqueId: string;
  contenido: ContenidoAgenda;
  puedeEditar: boolean;
}) {
  const puntosIniciales = contenido.puntos ?? [];
  const [tratados, establecerTratados] = useState<boolean[]>(
    puntosIniciales.map((punto) => punto.tratado === true),
  );
  const [error, establecerError] = useState<string | null>(null);
  const [guardando, iniciarTransicion] = useTransition();

  if (puntosIniciales.length === 0) {
    return <p className="text-xs text-atenuado">Esta agenda no tiene puntos cargados.</p>;
  }

  function alternar(indice: number) {
    const anterior = tratados;
    const siguiente = tratados.map((valor, posicion) => (posicion === indice ? !valor : valor));
    establecerTratados(siguiente);
    establecerError(null);

    iniciarTransicion(async () => {
      const resultado = await alternarPuntoDeAgenda({
        bloqueId,
        indice,
        tratado: siguiente[indice] === true,
      });

      if (!resultado.exito) {
        establecerTratados(anterior);
        establecerError(resultado.error);
      }
    });
  }

  return (
    <div>
      {contenido.introduccion !== undefined && contenido.introduccion !== '' ? (
        <p className="mb-2 text-xs text-atenuado">{contenido.introduccion}</p>
      ) : null}

      <ul className="divide-y divide-borde">
        {puntosIniciales.map((punto, indice) => {
          const tratado = tratados[indice] === true;

          return (
            <li key={`${punto.texto}-${indice}`} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2">
              {puedeEditar ? (
                <input
                  type="checkbox"
                  checked={tratado}
                  onChange={() => alternar(indice)}
                  aria-label={`Marcar como tratado: ${punto.texto}`}
                  className="mt-0.5 size-4 shrink-0 rounded border-borde bg-fondo accent-primario"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={clases(
                    'mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border text-micro',
                    tratado ? 'border-exito bg-exito/15 text-exito' : 'border-borde text-transparent',
                  )}
                >
                  ✓
                </span>
              )}

              <span
                className={clases(
                  'min-w-0 flex-1 text-sm leading-snug',
                  tratado ? 'text-atenuado line-through' : 'text-texto',
                )}
              >
                {punto.texto}
              </span>

              {punto.origen !== undefined && punto.origen !== '' ? (
                <span className="shrink-0 text-micro text-atenuado">{punto.origen}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-2 flex min-h-4 items-center gap-1.5 text-micro">
        {guardando ? (
          <>
            <Girador />
            <span className="text-atenuado">Guardando…</span>
          </>
        ) : null}
        {error !== null ? (
          <span role="alert" className="text-peligro">
            {error}
          </span>
        ) : null}
      </p>
    </div>
  );
}
