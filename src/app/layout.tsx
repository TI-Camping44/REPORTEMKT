import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { ProveedorTema } from '@/componentes/proveedor-tema';
import { DESCRIPCION_APLICACION, NOMBRE_APLICACION } from '@/lib/constantes';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--fuente-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: NOMBRE_APLICACION,
    template: `%s · ${NOMBRE_APLICACION}`,
  },
  description: DESCRIPCION_APLICACION,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1013' },
  ],
};

export default function DisenoRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PY" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh bg-fondo font-sans text-texto">
        <ProveedorTema>{children}</ProveedorTema>
      </body>
    </html>
  );
}
