import { EtiquetaEstadoHito } from '@/componentes/etiqueta';
import type { ContenidoHitos } from '@/lib/bloques';
import { formatearFecha } from '@/lib/formato';

export function BloqueHitos({ contenido }: { contenido: ContenidoHitos }) {
  const hitos = contenido.hitos ?? [];

  if (hitos.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene hitos cargados.</p>;
  }

  return (
    <ul className="divide-y divide-borde">
      {hitos.map((hito, indice) => (
        <li key={`${hito.titulo}-${indice}`} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-texto">{hito.titulo}</p>
            {hito.detalle !== undefined && hito.detalle !== '' ? (
              <p className="mt-0.5 text-xs leading-relaxed text-atenuado">{hito.detalle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {hito.responsable !== undefined && hito.responsable !== '' ? (
              <span className="text-micro text-atenuado">{hito.responsable}</span>
            ) : null}
            {hito.fecha !== undefined && hito.fecha !== null && hito.fecha !== '' ? (
              <span className="text-micro tabular-nums text-atenuado">{formatearFecha(hito.fecha)}</span>
            ) : null}
            <EtiquetaEstadoHito estado={hito.estado} />
          </div>
        </li>
      ))}
    </ul>
  );
}
