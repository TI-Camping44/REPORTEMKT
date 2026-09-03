'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Modo claro y oscuro en todas las pantallas.
 *
 * `attribute="class"` porque Tailwind esta configurado con darkMode: 'class'.
 * Por defecto sigue la preferencia del sistema operativo.
 */
export function ProveedorTema({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
