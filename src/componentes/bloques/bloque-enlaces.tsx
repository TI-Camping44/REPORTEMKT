import type { ContenidoEnlaces } from '@/lib/bloques';

export function BloqueEnlaces({ contenido }: { contenido: ContenidoEnlaces }) {
  const enlaces = contenido.enlaces ?? [];

  if (enlaces.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene enlaces cargados.</p>;
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {enlaces.map((enlace, indice) => (
        <li key={`${enlace.url}-${indice}`}>
          <a
            href={enlace.url}
            target="_blank"
            rel="noreferrer noopener"
            className="block rounded-md border border-borde bg-superficie px-3 py-2 transition-colors hover:border-primario/50"
          >
            <span className="block text-sm font-medium text-texto">{enlace.titulo}</span>
            {enlace.detalle !== undefined && enlace.detalle !== '' ? (
              <span className="mt-0.5 block text-micro text-atenuado">{enlace.detalle}</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
