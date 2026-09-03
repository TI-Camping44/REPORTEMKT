import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FormularioNuevoInforme } from '@/componentes/editor/formulario-nuevo-informe';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { listarInformesDeEmpresa, obtenerEmpresaPorSlug } from '@/lib/datos';
import { requerirEditor } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Nuevo informe' };

export default async function PaginaNuevoInforme({ params }: { params: { empresa: string } }) {
  await requerirEditor();

  const empresa = await obtenerEmpresaPorSlug(params.empresa);
  if (empresa === null) notFound();

  const informes = await listarInformesDeEmpresa(empresa.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo informe</h1>
        <p className="mt-0.5 text-xs text-atenuado">{empresa.nombre}</p>
      </header>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Período del informe"
          descripcion="El informe nace como borrador. Se publica cuando el contenido está completo."
        />
        <CuerpoTarjeta>
          <FormularioNuevoInforme
            empresaId={empresa.id}
            empresaSlug={empresa.slug}
            informes={informes}
          />
        </CuerpoTarjeta>
      </Tarjeta>
    </div>
  );
}
