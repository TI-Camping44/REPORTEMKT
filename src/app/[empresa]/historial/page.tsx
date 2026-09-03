import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EnlaceBoton } from '@/componentes/boton';
import { EtiquetaEstadoInforme } from '@/componentes/etiqueta';
import { CabeceraTarjeta, EstadoVacio, Tarjeta } from '@/componentes/tarjeta';
import { listarInformesDeEmpresa, obtenerEmpresaPorSlug, obtenerNombresDeUsuarios } from '@/lib/datos';
import { formatearFecha, formatearFechaHora } from '@/lib/formato';
import { rotularPeriodo, rotularRango } from '@/lib/periodos';
import { puedeEditar } from '@/lib/permisos';
import { requerirUsuario } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Historial' };

export default async function PaginaDeHistorial({ params }: { params: { empresa: string } }) {
  const { usuario } = await requerirUsuario();
  const empresa = await obtenerEmpresaPorSlug(params.empresa);

  if (empresa === null) notFound();

  const informes = await listarInformesDeEmpresa(empresa.id);
  const visibles = puedeEditar(usuario.rol)
    ? informes
    : informes.filter((informe) => informe.estado === 'publicado');

  const nombres = await obtenerNombresDeUsuarios(
    visibles.map((informe) => informe.creado_por).filter((id): id is string => id !== null),
  );

  return (
    <div className="mx-auto max-w-contenido space-y-4 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Historial de informes</h1>
          <p className="mt-0.5 text-xs text-atenuado">
            {empresa.nombre} · Un informe publicado es la foto de su período y no se reescribe.
          </p>
        </div>
        {puedeEditar(usuario.rol) ? (
          <EnlaceBoton href={`/${empresa.slug}/nuevo`} variante="primario">
            Nuevo informe
          </EnlaceBoton>
        ) : null}
      </header>

      {visibles.length === 0 ? (
        <EstadoVacio
          titulo="No hay informes cargados"
          detalle="Cuando Marketing cree el primer informe del período, va a aparecer en esta lista."
        />
      ) : (
        <Tarjeta>
          <CabeceraTarjeta titulo={`${visibles.length} informe${visibles.length === 1 ? '' : 's'}`} />
          <div className="desplazamiento-fino overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-borde">
                  <th scope="col" className="px-4 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                    Período
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                    Reunión
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                    Rango del período
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                    Última actualización
                  </th>
                  <th scope="col" className="px-4 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                    Creado por
                  </th>
                  <th scope="col" className="px-4 py-2 text-end font-medium uppercase tracking-wide text-atenuado">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {visibles.map((informe) => (
                  <tr key={informe.id} className="hover:bg-superficie">
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-texto">
                      <Link href={`/${empresa.slug}/${informe.id}`} className="hover:text-primario-texto">
                        {informe.periodo_etiqueta !== ''
                          ? informe.periodo_etiqueta
                          : rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-atenuado">
                      {formatearFecha(informe.reunion_fecha)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-atenuado">
                      {rotularRango(informe.periodo_inicio, informe.periodo_fin)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <EtiquetaEstadoInforme estado={informe.estado} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-atenuado">
                      {formatearFechaHora(informe.actualizado_en)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-atenuado">
                      {informe.creado_por !== null ? nombres.get(informe.creado_por) ?? '—' : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-end">
                      <Link
                        href={
                          puedeEditar(usuario.rol) && informe.estado === 'borrador'
                            ? `/${empresa.slug}/${informe.id}/editar`
                            : `/${empresa.slug}/${informe.id}`
                        }
                        className="text-primario-texto hover:underline"
                      >
                        {puedeEditar(usuario.rol) && informe.estado === 'borrador' ? 'Editar' : 'Ver'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
