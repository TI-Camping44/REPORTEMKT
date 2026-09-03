'use client';

/** Piezas compartidas por los formularios de bloque. */

import type { ReactNode } from 'react';

import { Boton } from '@/componentes/boton';

export function FilaEditable({
  numero,
  children,
  alEliminar,
  puedeEliminar = true,
}: {
  numero: number;
  children: ReactNode;
  alEliminar: () => void;
  puedeEliminar?: boolean;
}) {
  return (
    <li className="rounded-md border border-borde bg-superficie p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-micro font-medium uppercase tracking-wide text-atenuado">
          Fila {numero}
        </span>
        <Boton
          type="button"
          variante="peligro"
          tamano="chico"
          onClick={alEliminar}
          disabled={!puedeEliminar}
          title={puedeEliminar ? 'Eliminar esta fila' : 'Debe quedar al menos una fila'}
        >
          Eliminar
        </Boton>
      </div>
      {children}
    </li>
  );
}

export function BotonAgregar({ children, alAgregar }: { children: ReactNode; alAgregar: () => void }) {
  return (
    <Boton type="button" variante="secundario" tamano="chico" onClick={alAgregar}>
      {children}
    </Boton>
  );
}

/** Convierte lo que se escribe en un campo numerico en number o null. */
export function aNumeroOpcional(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

/** Reemplaza un elemento de una lista sin mutarla. */
export function reemplazar<T>(lista: T[], indice: number, elemento: T): T[] {
  return lista.map((actual, posicion) => (posicion === indice ? elemento : actual));
}

/** Quita un elemento de una lista sin mutarla. */
export function quitar<T>(lista: T[], indice: number): T[] {
  return lista.filter((_, posicion) => posicion !== indice);
}
