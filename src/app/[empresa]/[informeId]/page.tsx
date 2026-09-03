import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { VistaInforme } from '@/componentes/vista-informe';
import {
  listarInformesDeEmpresa,
  obtenerEmpresaPorSlug,
  obtenerInformeCompleto,
  obtenerNombresDeUsuarios,
} from '@/lib/datos';
import { puedeEditar } from '@/lib/permisos';
import { requerirUsuario } from '@/lib/sesion';
import { rotularPeriodo } from '@/lib/periodos';

export async function generateMetadata({
  params,
}: {
  params: { empresa: string; informeId: string };
}): Promise<Metadata> {
  const informe = await obtenerInformeCompleto(params.informeId);
  if (informe === null) return { title: 'Informe' };

  const periodo =
    informe.periodo_etiqueta !== ''
      ? informe.periodo_etiqueta
      : rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio);

  return { title: `${periodo} · ${informe.empresa?.nombre ?? ''}`.trim() };
}

/** Un informe concreto, elegido desde el selector de período o desde el historial. */
export default async function PaginaDeInforme({
  params,
}: {
  params: { empresa: string; informeId: string };
}) {
  const { usuario } = await requerirUsuario();
  const empresa = await obtenerEmpresaPorSlug(params.empresa);

  if (empresa === null) notFound();

  const informe = await obtenerInformeCompleto(params.informeId);

  // La direccion lleva la empresa: si el informe es de otra, es un enlace viejo.
  if (informe === null || informe.empresa_id !== empresa.id) notFound();

  const informes = await listarInformesDeEmpresa(empresa.id);
  const visibles = puedeEditar(usuario.rol)
    ? informes
    : informes.filter((candidato) => candidato.estado === 'publicado');

  const nombres = await obtenerNombresDeUsuarios(
    informe.creado_por !== null ? [informe.creado_por] : [],
  );

  return (
    <VistaInforme
      informe={informe}
      informesDeLaEmpresa={visibles}
      puedeEditar={puedeEditar(usuario.rol)}
      creadoPor={informe.creado_por !== null ? nombres.get(informe.creado_por) ?? null : null}
    />
  );
}
