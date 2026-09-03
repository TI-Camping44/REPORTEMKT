import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EditorInforme } from '@/componentes/editor/editor-informe';
import { EtiquetaEstadoInforme } from '@/componentes/etiqueta';
import { listarBloques, obtenerEmpresaPorSlug, obtenerInforme } from '@/lib/datos';
import { formatearFechaHora } from '@/lib/formato';
import { rotularPeriodo, rotularRango } from '@/lib/periodos';
import { requerirEditor } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Editar informe' };

export default async function PaginaDeEdicion({
  params,
}: {
  params: { empresa: string; informeId: string };
}) {
  await requerirEditor();

  const [empresa, informe] = await Promise.all([
    obtenerEmpresaPorSlug(params.empresa),
    obtenerInforme(params.informeId),
  ]);

  if (empresa === null || informe === null || informe.empresa_id !== empresa.id) {
    notFound();
  }

  const bloques = await listarBloques(informe.id);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-atenuado">
              {empresa.nombre}
            </span>
            <EtiquetaEstadoInforme estado={informe.estado} />
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio)}
          </h1>
          <p className="mt-0.5 text-xs text-atenuado">
            {rotularRango(informe.periodo_inicio, informe.periodo_fin)} · Actualizado el{' '}
            {formatearFechaHora(informe.actualizado_en)}
          </p>
        </div>

        <Link
          href={`/${empresa.slug}/${informe.id}`}
          className="rounded-md border border-borde px-3 py-1.5 text-sm transition-colors hover:bg-superficie"
        >
          Ver como lo ve Dirección
        </Link>
      </header>

      <EditorInforme informe={informe} bloques={bloques} empresaSlug={empresa.slug} />
    </div>
  );
}
