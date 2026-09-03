import { EtiquetaNivelAlerta } from '@/componentes/etiqueta';
import type { ContenidoAlertas } from '@/lib/bloques';

export function BloqueAlertas({ contenido }: { contenido: ContenidoAlertas }) {
  const alertas = contenido.alertas ?? [];

  if (alertas.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene alertas cargadas.</p>;
  }

  return (
    <ul className="space-y-2">
      {alertas.map((alerta, indice) => (
        <li
          key={`${alerta.titulo}-${indice}`}
          className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-md border border-borde bg-superficie px-3 py-2"
        >
          <EtiquetaNivelAlerta nivel={alerta.nivel} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-texto">{alerta.titulo}</p>
            {alerta.detalle !== undefined && alerta.detalle !== '' ? (
              <p className="mt-0.5 text-xs leading-relaxed text-atenuado">{alerta.detalle}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
