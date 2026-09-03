'use client';

/**
 * Tarjetas con detalle desplegable: influencers, acuerdos, proveedores.
 *
 * Es un componente de cliente porque abre un dialogo. No consulta datos: los
 * recibe por propiedades.
 */

import { useEffect, useState } from 'react';

import { CLASES_POR_TONO, Etiqueta } from '@/componentes/etiqueta';
import type { ContenidoFichas, Ficha } from '@/lib/bloques';
import { clases } from '@/lib/utilidades';

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter((parte) => parte !== '')
    .map((parte) => parte.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Materiales({ ficha }: { ficha: Ficha }) {
  const materiales = ficha.materiales ?? [];
  if (materiales.length === 0) return null;

  return (
    <ul className="mt-2 space-y-0.5">
      {materiales.map((material) => (
        <li key={material.url}>
          <a
            href={material.url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(evento) => evento.stopPropagation()}
            className="text-micro font-medium text-primario-texto hover:underline"
          >
            {material.titulo} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

export function BloqueFichas({ contenido }: { contenido: ContenidoFichas }) {
  const fichas = contenido.fichas ?? [];
  const [abierta, establecerAbierta] = useState<number | null>(null);

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') establecerAbierta(null);
    }
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, []);

  if (fichas.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene fichas cargadas.</p>;
  }

  const detalle = abierta === null ? null : fichas[abierta] ?? null;

  return (
    <div>
      {contenido.introduccion !== undefined && contenido.introduccion !== '' ? (
        <p className="mb-3 text-xs text-atenuado">{contenido.introduccion}</p>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {fichas.map((ficha, indice) => (
          <li key={`${ficha.nombre}-${indice}`}>
            <button
              type="button"
              onClick={() => establecerAbierta(indice)}
              className="h-full w-full rounded-md border border-borde bg-superficie p-3 text-start transition-colors hover:border-primario/50"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-8 items-center justify-center rounded-full bg-primario text-xs font-semibold text-white"
              >
                {iniciales(ficha.nombre)}
              </span>
              <span className="mt-2 block text-sm font-medium leading-snug text-texto">{ficha.nombre}</span>
              {ficha.rol !== undefined && ficha.rol !== '' ? (
                <span className="block text-micro text-atenuado">
                  {ficha.marca !== undefined && ficha.marca !== '' ? `${ficha.marca} · ` : ''}
                  {ficha.rol}
                </span>
              ) : null}
              <span className="mt-1.5 block">
                <Etiqueta className={CLASES_POR_TONO[ficha.tono]}>{ficha.estado}</Etiqueta>
              </span>
              <Materiales ficha={ficha} />
            </button>
          </li>
        ))}
      </ul>

      {detalle !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={detalle.nombre}
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) establecerAbierta(null);
          }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-borde bg-elevado p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-texto">{detalle.nombre}</h3>
                {detalle.rol !== undefined && detalle.rol !== '' ? (
                  <p className="text-xs text-atenuado">
                    {detalle.marca !== undefined && detalle.marca !== '' ? `${detalle.marca} · ` : ''}
                    {detalle.rol}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => establecerAbierta(null)}
                aria-label="Cerrar"
                className="shrink-0 rounded-md px-2 py-1 text-atenuado transition-colors hover:bg-superficie hover:text-texto"
              >
                ✕
              </button>
            </div>

            <dl className="mt-4 space-y-2 text-xs">
              <div>
                <dt className="text-micro uppercase tracking-wide text-atenuado">Estado</dt>
                <dd className="mt-0.5">
                  <Etiqueta className={CLASES_POR_TONO[detalle.tono]}>{detalle.estado}</Etiqueta>
                </dd>
              </div>
              {(detalle.campos ?? []).map((campo, indice) => (
                <div key={`${campo.etiqueta}-${indice}`}>
                  <dt className="text-micro uppercase tracking-wide text-atenuado">{campo.etiqueta}</dt>
                  <dd className={clases('mt-0.5 leading-relaxed', campo.valor === '' ? 'text-atenuado' : 'text-texto')}>
                    {campo.valor === '' ? 'Pendiente de carga' : campo.valor}
                  </dd>
                </div>
              ))}
              {(detalle.materiales ?? []).length > 0 ? (
                <div>
                  <dt className="text-micro uppercase tracking-wide text-atenuado">Materiales</dt>
                  <dd className="mt-0.5 space-y-0.5">
                    {(detalle.materiales ?? []).map((material) => (
                      <a
                        key={material.url}
                        href={material.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block font-medium text-primario-texto hover:underline"
                      >
                        {material.titulo} ↗
                      </a>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
