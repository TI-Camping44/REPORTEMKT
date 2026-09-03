'use client';

/** Carga de las direcciones de insercion de los tableros de Looker Studio. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Casilla, Etiquetado } from '@/componentes/campos';
import { guardarTablero } from '@/acciones/tableros';
import { ALTO_TABLERO_POR_DEFECTO } from '@/lib/constantes';
import type { Empresa, Tablero } from '@/lib/tipos';

export function TablaTableros({
  tableros,
  empresas,
}: {
  tableros: Tablero[];
  empresas: Empresa[];
}) {
  const nombreDeEmpresa = new Map(empresas.map((empresa) => [empresa.id, empresa.nombre]));

  return (
    <div className="space-y-3">
      {tableros.map((tablero) => (
        <FilaTablero
          key={tablero.id}
          tablero={tablero}
          nombreDeEmpresa={nombreDeEmpresa.get(tablero.empresa_id) ?? '—'}
        />
      ))}

      <p className="text-micro leading-relaxed text-atenuado">
        La dirección se saca de Looker Studio, en Archivo → Insertar informe → Insertar URL. Mientras
        quede vacía, la vista del informe muestra un recuadro que avisa que el tablero está pendiente
        de configuración.
      </p>
    </div>
  );
}

function FilaTablero({ tablero, nombreDeEmpresa }: { tablero: Tablero; nombreDeEmpresa: string }) {
  const router = useRouter();
  const [nombre, establecerNombre] = useState(tablero.nombre);
  const [url, establecerUrl] = useState(tablero.url_insercion);
  const [alto, establecerAlto] = useState(String(tablero.alto_px));
  const [activo, establecerActivo] = useState(tablero.activo);
  const [mensaje, establecerMensaje] = useState<string | null>(null);

  const altoNumero = Number(alto.trim());

  return (
    <div className="rounded-md border border-borde bg-superficie p-3">
      <p className="mb-2 text-micro font-medium uppercase tracking-wide text-atenuado">
        {nombreDeEmpresa}
      </p>

      <div className="grid gap-3 lg:grid-cols-6">
        <Etiquetado etiqueta="Nombre" className="lg:col-span-2">
          <CampoTexto value={nombre} onChange={(evento) => establecerNombre(evento.target.value)} />
        </Etiquetado>

        <Etiquetado etiqueta="Dirección de inserción" className="lg:col-span-3">
          <CampoTexto
            type="url"
            value={url}
            placeholder="https://lookerstudio.google.com/embed/reporting/…"
            onChange={(evento) => establecerUrl(evento.target.value)}
          />
        </Etiquetado>

        <Etiquetado etiqueta="Alto (px)" ayuda={`Por defecto ${ALTO_TABLERO_POR_DEFECTO}`}>
          <CampoTexto
            inputMode="numeric"
            value={alto}
            onChange={(evento) => establecerAlto(evento.target.value)}
          />
        </Etiquetado>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Casilla
          etiqueta="Mostrar en el informe"
          checked={activo}
          onChange={(evento) => establecerActivo(evento.target.checked)}
        />

        <BotonAccion
          accion={() =>
            guardarTablero({
              tableroId: tablero.id,
              nombre,
              urlInsercion: url,
              altoPx: Number.isFinite(altoNumero) ? altoNumero : ALTO_TABLERO_POR_DEFECTO,
              activo,
            })
          }
          etiquetaCargando="Guardando…"
          variante="primario"
          tamano="chico"
          alTerminar={(resultado) => {
            if (resultado.exito) {
              establecerMensaje(resultado.mensaje ?? 'Tablero guardado.');
              router.refresh();
            }
          }}
        >
          Guardar tablero
        </BotonAccion>

        {mensaje !== null ? (
          <Aviso tono="exito" className="py-1">
            {mensaje}
          </Aviso>
        ) : null}
      </div>
    </div>
  );
}
