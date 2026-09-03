import type { ContenidoLineaTiempo, EstadoPaso } from '@/lib/bloques';
import { clases } from '@/lib/utilidades';

const POR_ESTADO: Record<EstadoPaso, { barra: string; fecha: string; titulo: string; marca: string }> = {
  hecho: {
    barra: 'bg-exito',
    fecha: 'text-exito',
    titulo: 'text-texto',
    marca: '✓',
  },
  actual: {
    barra: 'bg-primario',
    fecha: 'text-primario-texto',
    titulo: 'text-texto font-medium',
    marca: '',
  },
  proximo: {
    barra: 'bg-borde',
    fecha: 'text-atenuado',
    titulo: 'text-atenuado',
    marca: '',
  },
};

/**
 * Avance de una campana en pasos con fecha.
 *
 * La fecha es texto libre porque el informe real mezcla dias concretos con
 * rangos como "Sept-Oct". No es una fecha que se opere: solo se muestra.
 */
export function BloqueLineaTiempo({ contenido }: { contenido: ContenidoLineaTiempo }) {
  const pasos = contenido.pasos ?? [];

  if (pasos.length === 0) {
    return <p className="text-xs text-atenuado">Esta línea de tiempo no tiene pasos cargados.</p>;
  }

  return (
    <ol className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
      {pasos.map((paso, indice) => {
        const estilo = POR_ESTADO[paso.estado];
        return (
          <li key={`${paso.titulo}-${indice}`} className="min-w-0">
            <span className={clases('block h-0.5 w-full rounded-full', estilo.barra)} aria-hidden="true" />
            <p className={clases('mt-1.5 text-xs font-semibold tabular-nums', estilo.fecha)}>
              {paso.fecha}
              {estilo.marca !== '' ? <span aria-hidden="true"> {estilo.marca}</span> : null}
            </p>
            <p className={clases('mt-0.5 text-xs leading-snug', estilo.titulo)}>{paso.titulo}</p>
          </li>
        );
      })}
    </ol>
  );
}
