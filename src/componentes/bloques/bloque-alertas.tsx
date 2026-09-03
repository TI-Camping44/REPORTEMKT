import { EtiquetaTono } from '@/componentes/etiqueta';
import type { ContenidoAlertas } from '@/lib/bloques';

/**
 * Estado general y puntos que requieren decision.
 *
 * El texto del chip lo escribe Marketing ("Aprobada", "Decidir ya", "Pausado")
 * y el tono decide el color. Antes eran tres niveles fijos y no alcanzaban: el
 * informe real usa siete rotulos distintos y cambian segun el tema.
 */
export function BloqueAlertas({ contenido }: { contenido: ContenidoAlertas }) {
  const alertas = contenido.alertas ?? [];

  if (alertas.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene puntos cargados.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {alertas.map((alerta, indice) => (
        <li
          key={`${alerta.titulo}-${indice}`}
          className="flex flex-wrap items-start gap-x-2.5 gap-y-1 rounded-md border border-borde bg-superficie px-3 py-2"
        >
          <span className="shrink-0 pt-0.5">
            <EtiquetaTono tono={alerta.tono}>{alerta.etiqueta}</EtiquetaTono>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-texto">{alerta.titulo}</p>
            {alerta.detalle !== undefined && alerta.detalle !== '' ? (
              <p className="mt-0.5 text-xs leading-relaxed text-atenuado">{alerta.detalle}</p>
            ) : null}
            {alerta.enlaces !== undefined && alerta.enlaces.length > 0 ? (
              <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                {alerta.enlaces.map((enlace) => (
                  <a
                    key={enlace.url}
                    href={enlace.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-medium text-primario-texto hover:underline"
                  >
                    {enlace.titulo} ↗
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
