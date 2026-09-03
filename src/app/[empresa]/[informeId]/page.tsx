import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { VistaInforme } from '@/componentes/vista-informe';
import {
  listarBloques,
  listarEnlaces,
  listarInformesDeEmpresa,
  listarTableros,
  obtenerEmpresaPorSlug,
  obtenerInforme,
  obtenerNombresDeUsuarios,
} from '@/lib/datos';
import { rotularPeriodo } from '@/lib/periodos';
import { puedeEditar } from '@/lib/permisos';
import { requerirUsuario } from '@/lib/sesion';

export async function generateMetadata({
  params,
}: {
  params: { empresa: string; informeId: string };
}): Promise<Metadata> {
  const informe = await obtenerInforme(params.informeId);
  if (informe === null) return { title: 'Informe' };
  return { title: rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio) };
}

export default async function PaginaDeInforme({
  params,
}: {
  params: { empresa: string; informeId: string };
}) {
  const { usuario } = await requerirUsuario();

  const [empresa, informe] = await Promise.all([
    obtenerEmpresaPorSlug(params.empresa),
    obtenerInforme(params.informeId),
  ]);

  if (empresa === null || informe === null || informe.empresa_id !== empresa.id) {
    notFound();
  }

  const informes = await listarInformesDeEmpresa(empresa.id);
  const visibles = puedeEditar(usuario.rol)
    ? informes
    : informes.filter((candidato) => candidato.estado === 'publicado' || candidato.id === informe.id);

  const [bloques, tableros, enlaces, nombres] = await Promise.all([
    listarBloques(informe.id),
    listarTableros(empresa.id),
    listarEnlaces(empresa.id),
    obtenerNombresDeUsuarios(informe.creado_por !== null ? [informe.creado_por] : []),
  ]);

  return (
    <VistaInforme
      empresa={empresa}
      informe={informe}
      informes={visibles}
      bloques={bloques}
      tableros={tableros}
      enlaces={enlaces}
      usuario={usuario}
      nombreDeQuienCreo={informe.creado_por !== null ? nombres.get(informe.creado_por) ?? null : null}
    />
  );
}
