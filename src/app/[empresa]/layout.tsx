import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { EncabezadoApp } from '@/componentes/encabezado-app';
import { listarEmpresas } from '@/lib/datos';
import { requerirUsuario } from '@/lib/sesion';

export default async function DisenoDeEmpresa({
  children,
  params,
}: {
  children: ReactNode;
  params: { empresa: string };
}) {
  const { usuario, correo } = await requerirUsuario();
  const empresas = await listarEmpresas();

  if (!empresas.some((empresa) => empresa.slug === params.empresa)) {
    notFound();
  }

  return (
    <div className="min-h-dvh">
      <EncabezadoApp empresas={empresas} slugActual={params.empresa} usuario={usuario} correo={correo} />
      <main className="mx-auto max-w-contenido px-4 py-6">{children}</main>
    </div>
  );
}
