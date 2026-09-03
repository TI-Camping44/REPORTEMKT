import { redirect } from 'next/navigation';

import { listarEmpresas } from '@/lib/datos';
import { requerirUsuario } from '@/lib/sesion';

/** La raiz no tiene contenido propio: lleva a la primera empresa. */
export default async function PaginaRaiz() {
  await requerirUsuario();

  const empresas = await listarEmpresas();
  const primera = empresas[0];

  if (primera === undefined) {
    return (
      <main className="mx-auto max-w-contenido px-4 py-16">
        <h1 className="text-lg font-semibold tracking-tight">No hay empresas cargadas</h1>
        <p className="mt-2 max-w-prose text-sm text-atenuado">
          La migración de datos iniciales carga Camping 44 y Vitálica. Si esta pantalla aparece,
          aplique las migraciones contra la base de datos y vuelva a intentarlo.
        </p>
      </main>
    );
  }

  redirect(`/${primera.slug}`);
}
