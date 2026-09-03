import type { ReactNode } from 'react';

import { EncabezadoApp } from '@/componentes/encabezado-app';
import { listarEmpresas } from '@/lib/datos';
import { requerirAdministrador } from '@/lib/sesion';

export default async function DisenoDeAdministracion({ children }: { children: ReactNode }) {
  const { usuario, correo } = await requerirAdministrador();
  const empresas = await listarEmpresas();

  return (
    <div className="min-h-dvh">
      <EncabezadoApp empresas={empresas} slugActual={null} usuario={usuario} correo={correo} />
      <main className="mx-auto max-w-contenido px-4 py-6">{children}</main>
    </div>
  );
}
