import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EnlaceBoton } from '@/componentes/boton';
import { EstadoVacio } from '@/componentes/tarjeta';
import { VistaInforme } from '@/componentes/vista-informe';
import {
  listarInformesDeEmpresa,
  obtenerEmpresaPorSlug,
  obtenerInformeCompleto,
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

  const elegido = visibles.find((candidato) => candidato.estado === 'publicado') ?? visibles[0];

  if (elegido === undefined) {
    return (
      <div className="mx-auto max-w-contenido px-4 py-6">
        <EstadoVacio
          titulo={`Todavía no hay informes de ${empresa.nombre}`}
          detalle="El primer informe se crea eligiendo la reunión que cubre. Después se puede duplicar para la siguiente."
          accion={
            puedeEditar(usuario.rol) ? (
              <EnlaceBoton href={`/${empresa.slug}/nuevo`} variante="primario">
                Crear el primer informe
              </EnlaceBoton>
            ) : undefined
          }
        />
      </div>
    );
  }

  const [informe, nombres] = await Promise.all([
    obtenerInformeCompleto(elegido.id),
    obtenerNombresDeUsuarios(elegido.creado_por !== null ? [elegido.creado_por] : []),
  ]);

  if (informe === null) notFound();

  return (
    <VistaInforme
      informe={informe}
      informesDeLaEmpresa={visibles}
      puedeEditar={puedeEditar(usuario.rol)}
      creadoPor={informe.creado_por !== null ? nombres.get(informe.creado_por) ?? null : null}
    />
  );
}
