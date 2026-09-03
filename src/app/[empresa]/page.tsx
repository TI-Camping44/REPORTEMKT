import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EnlaceBoton } from '@/componentes/boton';
import { EstadoVacio } from '@/componentes/tarjeta';
import { VistaInforme } from '@/componentes/vista-informe';
import {
  listarBloques,
  listarEnlaces,
  listarInformesDeEmpresa,
  listarTableros,
  obtenerEmpresaPorSlug,
  obtenerNombresDeUsuarios,
} from '@/lib/datos';
import { puedeEditar } from '@/lib/permisos';
import { requerirUsuario } from '@/lib/sesion';

export async function generateMetadata({
  params,
}: {
  params: { empresa: string };
}): Promise<Metadata> {
  const empresa = await obtenerEmpresaPorSlug(params.empresa);
  return { title: empresa?.nombre ?? 'Informe' };
}

/**
 * Vista principal de la empresa.
 *
 * Por defecto muestra el ultimo informe publicado. Si todavia no hay ninguno
 * publicado pero si un borrador, quien puede editar ve el borrador: de lo
 * contrario tendria que pasar por el historial para encontrar lo que esta
 * escribiendo.
 */
export default async function PaginaDeEmpresa({ params }: { params: { empresa: string } }) {
  const { usuario } = await requerirUsuario();
  const empresa = await obtenerEmpresaPorSlug(params.empresa);

  if (empresa === null) notFound();

  const informes = await listarInformesDeEmpresa(empresa.id);
  const visibles = puedeEditar(usuario.rol)
    ? informes
    : informes.filter((informe) => informe.estado === 'publicado');

  const informe = visibles.find((candidato) => candidato.estado === 'publicado') ?? visibles[0];

  if (informe === undefined) {
    return (
      <EstadoVacio
        titulo={`Todavía no hay informes de ${empresa.nombre}`}
        detalle="El primer informe se crea eligiendo un período. Después se puede duplicar para el período siguiente."
        accion={
          puedeEditar(usuario.rol) ? (
            <EnlaceBoton href={`/${empresa.slug}/nuevo`} variante="primario">
              Crear el primer informe
            </EnlaceBoton>
          ) : undefined
        }
      />
    );
  }

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
