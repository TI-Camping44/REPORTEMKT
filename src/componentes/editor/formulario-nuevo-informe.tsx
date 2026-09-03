'use client';

/**
 * Alta de un informe para un periodo.
 *
 * La casilla de duplicar el informe anterior esta marcada por defecto a
 * proposito: entre una quincena y la siguiente cambia una parte del contenido,
 * no todo. Si hay que escribir el informe entero cada vez, en dos meses el
 * equipo vuelve al PDF.
 */

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { Girador } from '@/componentes/boton-accion';
import { Casilla, Etiquetado, Selector } from '@/componentes/campos';
import { crearInforme } from '@/acciones/informes';
import { ETIQUETAS_TIPO_PERIODO, TIPOS_PERIODO, type TipoPeriodo } from '@/lib/constantes';
import { periodosRecientes, rotularPeriodo, rotularRango } from '@/lib/periodos';
import type { Informe } from '@/lib/tipos';

export function FormularioNuevoInforme({
  empresaId,
  empresaSlug,
  informes,
}: {
  empresaId: string;
  empresaSlug: string;
  informes: Informe[];
}) {
  const router = useRouter();
  const [enCurso, iniciarTransicion] = useTransition();
  const [error, establecerError] = useState<string | null>(null);

  const [tipo, establecerTipo] = useState<TipoPeriodo>('quincenal');
  const [inicio, establecerInicio] = useState<string>('');
  const [duplicar, establecerDuplicar] = useState(true);
  const [origen, establecerOrigen] = useState<string>(informes[0]?.id ?? '');

  const periodos = useMemo(() => periodosRecientes(tipo, 14), [tipo]);

  const ocupados = useMemo(() => {
    const conjunto = new Set<string>();
    for (const informe of informes) {
      if (informe.periodo_tipo === tipo) {
        conjunto.add(informe.periodo_inicio);
      }
    }
    return conjunto;
  }, [informes, tipo]);

  const disponibles = periodos.filter((periodo) => !ocupados.has(periodo.inicio));
  const inicioElegido = inicio !== '' ? inicio : disponibles[0]?.inicio ?? '';

  function enviar() {
    establecerError(null);

    if (inicioElegido === '') {
      establecerError('No queda ningún período disponible de ese tipo. Elija el otro tipo de período.');
      return;
    }

    iniciarTransicion(async () => {
      const resultado = await crearInforme({
        empresaId,
        empresaSlug,
        periodoTipo: tipo,
        periodoInicio: inicioElegido,
        duplicarDe: duplicar && origen !== '' ? origen : null,
      });

      if (!resultado.exito) {
        establecerError(resultado.error);
        return;
      }

      router.push(`/${empresaSlug}/${resultado.id}/editar`);
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Etiquetado etiqueta="Tipo de período">
          <Selector
            value={tipo}
            onChange={(evento) => {
              establecerTipo(evento.target.value as TipoPeriodo);
              establecerInicio('');
            }}
          >
            {TIPOS_PERIODO.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_TIPO_PERIODO[valor]}
              </option>
            ))}
          </Selector>
        </Etiquetado>

        <Etiquetado
          etiqueta="Período"
          ayuda={
            disponibles.length === 0
              ? 'Todos los períodos recientes de este tipo ya tienen informe.'
              : 'Solo se listan los períodos que todavía no tienen informe.'
          }
        >
          <Selector
            value={inicioElegido}
            disabled={disponibles.length === 0}
            onChange={(evento) => establecerInicio(evento.target.value)}
          >
            {disponibles.map((periodo) => (
              <option key={periodo.inicio} value={periodo.inicio}>
                {rotularPeriodo(periodo.tipo, periodo.inicio)} · {rotularRango(periodo.inicio, periodo.fin)}
              </option>
            ))}
          </Selector>
        </Etiquetado>
      </div>

      {informes.length > 0 ? (
        <div className="rounded-md border border-borde bg-superficie px-3 py-3">
          <Casilla
            etiqueta="Duplicar el contenido de un informe anterior"
            checked={duplicar}
            onChange={(evento) => establecerDuplicar(evento.target.checked)}
          />
          <p className="mt-1 text-micro text-atenuado">
            Copia los bloques con su contenido para editar solo lo que cambió. El informe de origen no
            se modifica.
          </p>

          {duplicar ? (
            <Etiquetado etiqueta="Informe de origen" className="mt-3">
              <Selector value={origen} onChange={(evento) => establecerOrigen(evento.target.value)}>
                {informes.map((informe) => (
                  <option key={informe.id} value={informe.id}>
                    {rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio)}
                  </option>
                ))}
              </Selector>
            </Etiquetado>
          ) : null}
        </div>
      ) : null}

      {error !== null ? <Aviso tono="error">{error}</Aviso> : null}

      <Boton type="submit" variante="primario" disabled={enCurso} aria-busy={enCurso}>
        {enCurso ? (
          <>
            <Girador />
            Creando el informe…
          </>
        ) : (
          'Crear informe'
        )}
      </Boton>
    </form>
  );
}
