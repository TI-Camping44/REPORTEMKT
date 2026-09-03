import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EditorInforme } from '@/componentes/editor/editor-informe';
import { EtiquetaEstadoInforme } from '@/componentes/etiqueta';
import { obtenerEmpresaPorSlug, obtenerInformeCompleto } from '@/lib/datos';
import { hayCredencialDePlanillas } from '@/lib/entorno';
import { formatearFecha, formatearFechaHora } from '@/lib/formato';
import { rotularPeriodo } from '@/lib/periodos';
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
    obtenerInformeCompleto(params.informeId),
  ]);

  if (empresa === null || informe === null || informe.empresa_id !== empresa.id) {
    notFound();
  }

  const periodo =
    informe.periodo_etiqueta !== ''
      ? informe.periodo_etiqueta
      : rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio);

  return (
    <div className="mx-auto max-w-contenido space-y-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-atenuado">
              {empresa.nombre}
            </span>
            <EtiquetaEstadoInforme estado={informe.estado} />
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{periodo}</h1>
          <p className="mt-0.5 text-xs text-atenuado">
            Reunión del {formatearFecha(informe.reunion_fecha)} · Actualizado el{' '}
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

      <EditorInforme
        informe={informe}
        empresaSlug={empresa.slug}
        planillasDisponibles={hayCredencialDePlanillas()}
      />
    </div>
  );
}
