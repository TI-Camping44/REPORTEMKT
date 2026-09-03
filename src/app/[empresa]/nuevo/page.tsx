import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FormularioNuevoInforme } from '@/componentes/editor/formulario-nuevo-informe';
import { obtenerEmpresaPorSlug, obtenerUltimoInforme } from '@/lib/datos';
import { requerirEditor } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Nuevo informe' };

export default async function PaginaNuevoInforme({ params }: { params: { empresa: string } }) {
  await requerirEditor();

  const empresa = await obtenerEmpresaPorSlug(params.empresa);
  if (empresa === null) notFound();

  const ultimo = await obtenerUltimoInforme(empresa.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo informe</h1>
        <p className="mt-0.5 text-xs text-atenuado">
          {empresa.nombre} · Nace como borrador y se publica cuando el contenido está completo.
        </p>
      </header>

      <FormularioNuevoInforme
        empresaId={empresa.id}
        empresaSlug={empresa.slug}
        empresaNombre={empresa.nombre}
        ultimoInforme={ultimo}
      />
    </div>
  );
}
