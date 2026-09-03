'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { clasesDeBoton } from '@/componentes/boton';

const OPCIONES = [
  { valor: 'light', etiqueta: 'Claro' },
  { valor: 'dark', etiqueta: 'Oscuro' },
  { valor: 'system', etiqueta: 'Sistema' },
] as const;

export function SelectorTema() {
  const { theme, setTheme } = useTheme();
  const [montado, establecerMontado] = useState(false);

  // Hasta que el componente se monta no se conoce el tema resuelto. Dibujar el
  // estado activo antes de eso produce una diferencia entre servidor y cliente.
  useEffect(() => {
    establecerMontado(true);
  }, []);

  return (
    <div
      className="inline-flex rounded-md border border-borde bg-elevado p-0.5"
      role="group"
      aria-label="Tema de la interfaz"
    >
      {OPCIONES.map((opcion) => {
        const activo = montado && theme === opcion.valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setTheme(opcion.valor)}
            aria-pressed={activo}
            className={clasesDeBoton(
              activo ? 'secundario' : 'sutil',
              'chico',
              activo ? 'border-borde' : 'border-transparent',
            )}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
