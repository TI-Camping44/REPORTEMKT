'use client';

/**
 * Pestanas del informe.
 *
 * Son anclas, no un cambio de vista: el documento entero esta en la pagina y
 * las pestanas solo llevan a cada seccion. Asi se puede imprimir completo y
 * buscar con el navegador sobre todo el contenido.
 *
 * La pestana activa se resuelve mirando cual seccion esta mas arriba en la
 * pantalla, que es lo que hace el informe que Marketing presenta hoy.
 */

import { useEffect, useState } from 'react';

import { clases } from '@/lib/utilidades';

export function PestanasSecciones({
  secciones,
}: {
  secciones: Array<{ clave: string; titulo: string }>;
}) {
  const [activa, establecerActiva] = useState<string>(secciones[0]?.clave ?? '');

  useEffect(() => {
    function alDesplazar() {
      let actual = secciones[0]?.clave ?? '';
      for (const seccion of secciones) {
        const elemento = document.getElementById(seccion.clave);
        if (elemento !== null && elemento.getBoundingClientRect().top < 160) {
          actual = seccion.clave;
        }
      }
      establecerActiva(actual);
    }

    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, [secciones]);

  if (secciones.length <= 1) return null;

  return (
    <nav
      aria-label="Secciones del informe"
      className="desplazamiento-fino sticky top-[3.25rem] z-10 -mx-4 overflow-x-auto border-b border-borde bg-fondo/95 px-4 backdrop-blur"
    >
      <ul className="flex min-w-max gap-1 py-1.5">
        {secciones.map((seccion) => (
          <li key={seccion.clave}>
            <a
              href={`#${seccion.clave}`}
              aria-current={activa === seccion.clave ? 'true' : undefined}
              className={clases(
                'inline-block rounded-md px-3 py-1 text-sm transition-colors',
                activa === seccion.clave
                  ? 'bg-superficie font-medium text-texto'
                  : 'text-atenuado hover:text-texto',
              )}
            >
              {seccion.titulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
