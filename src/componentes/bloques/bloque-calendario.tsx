import type { ContenidoCalendario, EventoCalendario } from '@/lib/bloques';
import { formatearMes } from '@/lib/formato';
import { clases } from '@/lib/utilidades';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

/** Indice del primer dia del mes en una semana que arranca el lunes. */
function primerDiaDeLaSemana(anio: number, mes: number): number {
  const domingoPrimero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  return (domingoPrimero + 6) % 7;
}

function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

const CLASES_EVENTO: Record<EventoCalendario['tipo'], string> = {
  evento: 'bg-primario text-white',
  activacion: 'bg-advertencia/25 text-advertencia',
};

/**
 * Grilla mensual de eventos y activaciones.
 *
 * No es un grafico: es una tabla de dias con etiquetas. La grilla se calcula
 * en UTC para que el dia de la semana no dependa del huso del servidor.
 */
export function BloqueCalendario({ contenido }: { contenido: ContenidoCalendario }) {
  const mes = contenido.mes ?? '';
  const eventos = contenido.eventos ?? [];
  const proximos = contenido.proximos ?? [];

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    return <p className="text-xs text-atenuado">Este calendario no tiene un mes válido cargado.</p>;
  }

  const [anioTexto, mesTexto] = mes.split('-');
  const anio = Number(anioTexto);
  const numeroDeMes = Number(mesTexto);
  const desplazamiento = primerDiaDeLaSemana(anio, numeroDeMes);
  const total = diasDelMes(anio, numeroDeMes);

  const porDia = new Map<number, EventoCalendario[]>();
  for (const evento of eventos) {
    const lista = porDia.get(evento.dia) ?? [];
    lista.push(evento);
    porDia.set(evento.dia, lista);
  }

  const celdas: Array<number | null> = [
    ...Array.from({ length: desplazamiento }, () => null),
    ...Array.from({ length: total }, (_, indice) => indice + 1),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
      <div>
        <p className="mb-2 text-xs font-medium capitalize text-atenuado">{formatearMes(`${mes}-01`)}</p>
        <div className="desplazamiento-fino -mx-4 overflow-x-auto px-4">
          <div className="grid min-w-[34rem] grid-cols-7 gap-1 text-micro">
            {DIAS.map((dia) => (
              <div key={dia} className="py-1 text-center font-semibold text-atenuado">
                {dia}
              </div>
            ))}
            {celdas.map((dia, indice) => {
              if (dia === null) return <div key={`vacio-${indice}`} />;
              const delDia = porDia.get(dia) ?? [];
              return (
                <div
                  key={dia}
                  className={clases(
                    'min-h-14 rounded-md border border-borde p-1',
                    delDia.length > 0 ? 'bg-superficie' : '',
                  )}
                >
                  <span className={clases('font-semibold', delDia.length > 0 ? 'text-texto' : 'text-atenuado')}>
                    {dia}
                  </span>
                  {delDia.map((evento, posicion) => (
                    <span
                      key={`${evento.nombre}-${posicion}`}
                      title={evento.nombre}
                      className={clases(
                        'mt-1 block break-words rounded px-1 py-0.5 font-medium leading-tight',
                        CLASES_EVENTO[evento.tipo],
                      )}
                    >
                      {evento.nombre}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-xs">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-micro text-atenuado">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-primario" aria-hidden="true" /> Eventos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-advertencia/25" aria-hidden="true" /> Activaciones
          </span>
        </div>

        <ul className="mt-2 space-y-1">
          {eventos.length === 0 ? (
            <li className="text-atenuado">Sin eventos cargados en el mes.</li>
          ) : (
            eventos.map((evento, indice) => (
              <li key={`${evento.nombre}-${indice}`} className="text-texto">
                <span className="font-semibold tabular-nums">
                  {String(evento.dia).padStart(2, '0')}/{mesTexto}
                </span>{' '}
                — {evento.nombre}
                {evento.tipo === 'activacion' ? <span className="text-atenuado"> (activación)</span> : null}
              </li>
            ))
          )}
        </ul>

        {proximos.length > 0 ? (
          <div className="mt-3 border-t border-borde pt-2">
            <p className="text-micro font-semibold uppercase tracking-wide text-atenuado">Próximos</p>
            <ul className="mt-1 space-y-1">
              {proximos.map((proximo, indice) => (
                <li key={`${proximo.nombre}-${indice}`} className="text-texto">
                  <span className="font-semibold tabular-nums">{proximo.fecha}</span> — {proximo.nombre}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
