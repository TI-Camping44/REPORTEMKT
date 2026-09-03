'use client';

/** Formulario del encabezado del informe: periodo y datos de la reunion. */

import { useState } from 'react';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Etiquetado, Selector } from '@/componentes/campos';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { guardarEncabezado } from '@/acciones/informes';
import { ETIQUETAS_TIPO_PERIODO, TIPOS_PERIODO, type TipoPeriodo } from '@/lib/constantes';
import type { Informe } from '@/lib/tipos';

export function EditorEncabezado({ informe }: { informe: Informe }) {
  const [titulo, establecerTitulo] = useState(informe.titulo);
  const [periodoTipo, establecerPeriodoTipo] = useState<TipoPeriodo>(informe.periodo_tipo);
  const [periodoInicio, establecerPeriodoInicio] = useState(informe.periodo_inicio);
  const [periodoFin, establecerPeriodoFin] = useState(informe.periodo_fin);
  const [periodoEtiqueta, establecerPeriodoEtiqueta] = useState(informe.periodo_etiqueta);
  const [reunionFecha, establecerReunionFecha] = useState(informe.reunion_fecha);
  const [reunionHora, establecerReunionHora] = useState(informe.reunion_hora);
  const [presenta, establecerPresenta] = useState(informe.presenta);
  const [mensaje, establecerMensaje] = useState<string | null>(null);

  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo="Encabezado"
        descripcion="Es lo primero que ve Dirección al abrir el informe."
      />
      <CuerpoTarjeta className="space-y-3">
        <Etiquetado etiqueta="Título">
          <CampoTexto
            value={titulo}
            placeholder="Reporte de Marketing"
            onChange={(evento) => establecerTitulo(evento.target.value)}
          />
        </Etiquetado>

        <Etiquetado
          etiqueta="Período tal como se presenta"
          ayuda="Se escribe completo, con sus palabras: «julio 2026 + avances al 14/08»."
        >
          <CampoTexto
            value={periodoEtiqueta}
            placeholder="julio 2026 + avances al 14/08"
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
              placeholder="Martín Benítez"
              onChange={(evento) => establecerPresenta(evento.target.value)}
            />
          </Etiquetado>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Etiquetado etiqueta="Cadencia" ayuda="Solo ordena el historial.">
            <Selector
              value={periodoTipo}
              onChange={(evento) => establecerPeriodoTipo(evento.target.value as TipoPeriodo)}
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

        {mensaje !== null ? <Aviso tono="exito">{mensaje}</Aviso> : null}

        <BotonAccion
          accion={() =>
            guardarEncabezado({
              informeId: informe.id,
              titulo,
              periodoTipo,
              periodoInicio,
              periodoFin,
              periodoEtiqueta,
              reunionFecha,
              reunionHora,
              presenta,
            })
          }
          etiquetaCargando="Guardando…"
          variante="primario"
          alTerminar={(resultado) => {
            if (resultado.exito) establecerMensaje(resultado.mensaje ?? 'Encabezado guardado.');
          }}
        >
          Guardar encabezado
        </BotonAccion>
      </CuerpoTarjeta>
    </Tarjeta>
  );
}
