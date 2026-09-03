import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/componentes/tarjeta';
import type { Enlace } from '@/lib/tipos';

export function ListaEnlaces({ enlaces }: { enlaces: Enlace[] }) {
  if (enlaces.length === 0) return null;

  return (
    <Tarjeta>
      <CabeceraTarjeta titulo="Enlaces útiles" descripcion="Documentos y planillas de esta empresa." />
      <CuerpoTarjeta>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {enlaces.map((enlace) => (
            <li key={enlace.id}>
              <a
                href={enlace.url}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-md border border-borde bg-superficie px-3 py-2 text-sm text-texto transition-colors hover:border-primario/50"
              >
                {enlace.titulo}
              </a>
            </li>
          ))}
        </ul>
      </CuerpoTarjeta>
    </Tarjeta>
  );
}
