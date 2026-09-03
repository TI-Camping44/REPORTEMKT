'use client';

/**
 * Selector del periodo del informe.
 *
 * Navega al informe elegido. Recibe la lista ya resuelta por el servidor: un
 * componente de cliente no consulta Supabase.
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Girador } from '@/componentes/boton-accion';
import { Selector } from '@/componentes/campos';
import { ETIQUETAS_ESTADO_INFORME } from '@/lib/constantes';
import { rotularPeriodo } from '@/lib/periodos';
import type { Informe } from '@/lib/tipos';

export function SelectorPeriodo({
  informes,
  informeActualId,
  empresaSlug,
}: {
  informes: Informe[];
  informeActualId: string;
  empresaSlug: string;
}) {
  const router = useRouter();
  const [navegando, iniciarTransicion] = useTransition();

  if (informes.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Selector
        aria-label="Período del informe"
        className="w-auto min-w-56 text-xs"
        value={informeActualId}
        disabled={navegando}
        onChange={(evento) => {
          const destino = evento.target.value;
          if (destino === informeActualId) return;
          iniciarTransicion(() => {
            router.push(`/${empresaSlug}/${destino}`);
          });
        }}
      >
        {informes.map((informe) => (
          <option key={informe.id} value={informe.id}>
            {informe.periodo_etiqueta !== ''
              ? informe.periodo_etiqueta
              : rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio)}
            {informe.estado === 'borrador' ? ` · ${ETIQUETAS_ESTADO_INFORME.borrador}` : ''}
          </option>
        ))}
      </Selector>
      {navegando ? <Girador /> : null}
    </div>
  );
}
