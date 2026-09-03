'use client';

/**
 * Alta de un informe.
 *
 * La opcion de duplicar el anterior no es un extra: entre una reunion y la
 * siguiente cambia una parte del contenido, no todo. Si hubiera que escribir el
 * informe entero cada vez, en dos meses se vuelve al PDF.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Casilla, Etiquetado, Selector } from '@/componentes/campos';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { crearInforme } from '@/acciones/informes';
import { ETIQUETAS_TIPO_PERIODO, TIPOS_PERIODO, type TipoPeriodo } from '@/lib/constantes';
import { calcularPeriodo, hoyEnAsuncion, rotularPeriodo } from '@/lib/periodos';
import type { Informe } from '@/lib/tipos';

export function FormularioNuevoInforme({
  empresaId,
  empresaSlug,
  empresaNombre,
  ultimoInforme,
}: {
  empresaId: string;
  empresaSlug: string;
  empresaNombre: string;
  ultimoInforme: Informe | null;
}) {
  const router = useRouter();
  const hoy = hoyEnAsuncion();
  const periodoInicial = calcularPeriodo('mensual', hoy);

  const [titulo, establecerTitulo] = useState('Reporte de Marketing');
  const [periodoTipo, establecerPeriodoTipo] = useState<TipoPeriodo>('mensual');
  const [periodoInicio, establecerPeriodoInicio] = useState(periodoInicial.inicio);
  const [periodoFin, establecerPeriodoFin] = useState(periodoInicial.fin);
  const [periodoEtiqueta, establecerPeriodoEtiqueta] = useState(
    rotularPeriodo('mensual', periodoInicial.inicio),
  );
  const [reunionFecha, establecerReunionFecha] = useState(hoy);
  const [reunionHora, establecerReunionHora] = useState('');
  const [presenta, establecerPresenta] = useState(ultimoInforme?.presenta ?? '');
  const [duplicar, establecerDuplicar] = useState(ultimoInforme !== null);

  /** Al cambiar la cadencia se recalculan las fechas y el rotulo sugerido. */
  function cambiarCadencia(tipo: TipoPeriodo) {
    const periodo = calcularPeriodo(tipo, periodoInicio);
    establecerPeriodoTipo(tipo);
    establecerPeriodoInicio(periodo.inicio);
    establecerPeriodoFin(periodo.fin);
    establecerPeriodoEtiqueta(rotularPeriodo(tipo, periodo.inicio));
  }

  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo={`Nuevo informe de ${empresaNombre}`}
        descripcion="Un informe por reunión con Gerencia General."
      />
      <CuerpoTarjeta className="space-y-3">
        <Etiquetado etiqueta="Título">
          <CampoTexto value={titulo} onChange={(evento) => establecerTitulo(evento.target.value)} />
        </Etiquetado>

        <Etiquetado
          etiqueta="Período tal como se presenta"
          ayuda="Se escribe completo: «julio 2026 + avances al 14/08»."
        >
          <CampoTexto
            value={periodoEtiqueta}
            onChange={(evento) => establecerPeriodoEtiqueta(evento.target.value)}
          />
        </Etiquetado>

        <div className="grid gap-3 sm:grid-cols-3">
          <Etiquetado etiqueta="Fecha de la reunión">
            <CampoTexto
              type="date"
              value={reunionFecha}
              onChange={(evento) => establecerReunionFecha(evento.target.value)}
            />
          </Etiquetado>

          <Etiquetado etiqueta="Horario" ayuda="Texto libre: «14:00–15:00».">
            <CampoTexto
              value={reunionHora}
              placeholder="14:00–15:00"
              onChange={(evento) => establecerReunionHora(evento.target.value)}
            />
          </Etiquetado>

          <Etiquetado etiqueta="Presenta">
            <CampoTexto
              value={presenta}
              onChange={(evento) => establecerPresenta(evento.target.value)}
            />
          </Etiquetado>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Etiquetado etiqueta="Cadencia" ayuda="Solo ordena el historial.">
            <Selector
              value={periodoTipo}
              onChange={(evento) => cambiarCadencia(evento.target.value as TipoPeriodo)}
            >
              {TIPOS_PERIODO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO_PERIODO[tipo]}
                </option>
              ))}
            </Selector>
          </Etiquetado>

          <Etiquetado etiqueta="Desde">
            <CampoTexto
              type="date"
              value={periodoInicio}
              onChange={(evento) => establecerPeriodoInicio(evento.target.value)}
            />
          </Etiquetado>

          <Etiquetado etiqueta="Hasta">
            <CampoTexto
              type="date"
              value={periodoFin}
              onChange={(evento) => establecerPeriodoFin(evento.target.value)}
            />
          </Etiquetado>
        </div>

        {ultimoInforme !== null ? (
          <div className="rounded-md border border-borde bg-superficie px-3 py-2.5">
            <Casilla
              etiqueta="Duplicar el informe anterior como punto de partida"
              checked={duplicar}
              onChange={(evento) => establecerDuplicar(evento.target.checked)}
            />
            <p className="mt-1 text-micro leading-relaxed text-atenuado">
              Se copian las secciones y los bloques de{' '}
              <strong className="font-medium text-texto">
                {ultimoInforme.periodo_etiqueta !== ''
                  ? ultimoInforme.periodo_etiqueta
                  : rotularPeriodo(ultimoInforme.periodo_tipo, ultimoInforme.periodo_inicio)}
              </strong>
              , con el contenido tal como quedó. Los temas de la agenda se copian sin tildar.
            </p>
          </div>
        ) : null}

        <BotonAccion
          accion={() =>
            crearInforme({
              empresaId,
              titulo,
              periodoTipo,
              periodoInicio,
              periodoFin,
              periodoEtiqueta,
              reunionFecha,
              reunionHora,
              presenta,
              duplicarDe: duplicar && ultimoInforme !== null ? ultimoInforme.id : undefined,
            })
          }
          etiquetaCargando="Creando…"
          variante="primario"
          alTerminar={(resultado) => {
            if (resultado.exito && resultado.id !== undefined) {
              router.push(`/${empresaSlug}/${resultado.id}/editar`);
            }
          }}
        >
          Crear informe
        </BotonAccion>
      </CuerpoTarjeta>
    </Tarjeta>
  );
}
