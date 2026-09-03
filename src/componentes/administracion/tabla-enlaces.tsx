'use client';

/** Enlaces utiles por empresa: planilla de pautas, control presupuestario, NPS. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { BotonAccion, Girador } from '@/componentes/boton-accion';
import { CampoTexto, Etiquetado } from '@/componentes/campos';
import { agregarEnlace, eliminarEnlace } from '@/acciones/enlaces';
import type { Empresa, Enlace } from '@/lib/tipos';

export function TablaEnlaces({ empresas, enlaces }: { empresas: Empresa[]; enlaces: Enlace[] }) {
  return (
    <div className="space-y-4">
      {empresas.map((empresa) => (
        <BloqueDeEmpresa
          key={empresa.id}
          empresa={empresa}
          enlaces={enlaces.filter((enlace) => enlace.empresa_id === empresa.id)}
        />
      ))}
    </div>
  );
}

function BloqueDeEmpresa({ empresa, enlaces }: { empresa: Empresa; enlaces: Enlace[] }) {
  const router = useRouter();
  const [titulo, establecerTitulo] = useState('');
  const [url, establecerUrl] = useState('');
  const [enviando, establecerEnviando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);

  async function enviar() {
    establecerError(null);
    establecerEnviando(true);

    const resultado = await agregarEnlace({ empresaId: empresa.id, titulo, url });

    establecerEnviando(false);

    if (!resultado.exito) {
      establecerError(resultado.error);
      return;
    }

    establecerTitulo('');
    establecerUrl('');
    router.refresh();
  }

  return (
    <div className="rounded-md border border-borde bg-superficie p-3">
      <p className="mb-2 text-micro font-medium uppercase tracking-wide text-atenuado">
        {empresa.nombre}
      </p>

      {enlaces.length === 0 ? (
        <p className="mb-3 text-xs text-atenuado">
          Todavía no hay enlaces cargados para esta empresa.
        </p>
      ) : (
        <ul className="mb-3 divide-y divide-borde">
          {enlaces.map((enlace) => (
            <li key={enlace.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-texto">{enlace.titulo}</p>
                <p className="truncate text-micro text-atenuado">{enlace.url}</p>
              </div>
              <BotonAccion
                accion={() => eliminarEnlace(enlace.id)}
                etiquetaCargando="Eliminando…"
                variante="peligro"
                tamano="chico"
                confirmacion={`¿Eliminar el enlace «${enlace.titulo}»?`}
                alTerminar={(resultado) => {
                  if (resultado.exito) router.refresh();
                }}
              >
                Eliminar
              </BotonAccion>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        <Etiquetado etiqueta="Título">
          <CampoTexto
            value={titulo}
            placeholder="Planilla de pautas"
            onChange={(evento) => establecerTitulo(evento.target.value)}
          />
        </Etiquetado>

        <Etiquetado etiqueta="Dirección">
          <CampoTexto
            type="url"
            value={url}
            placeholder="https://"
            onChange={(evento) => establecerUrl(evento.target.value)}
          />
        </Etiquetado>

        <Boton type="submit" variante="secundario" disabled={enviando} aria-busy={enviando}>
          {enviando ? (
            <>
              <Girador />
              Agregando…
            </>
          ) : (
            'Agregar'
          )}
        </Boton>
      </form>

      {error !== null ? (
        <Aviso tono="error" className="mt-2">
          {error}
        </Aviso>
      ) : null}
    </div>
  );
}
