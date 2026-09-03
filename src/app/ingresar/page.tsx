import type { Metadata } from 'next';

import { clasesDeBoton } from '@/componentes/boton';
import { Aviso } from '@/componentes/aviso';
import { SelectorTema } from '@/componentes/selector-tema';
import { DESCRIPCION_APLICACION, NOMBRE_APLICACION } from '@/lib/constantes';

export const metadata: Metadata = {
  title: 'Ingresar',
};

export default function PaginaDeIngreso({
  searchParams,
}: {
  searchParams: { error?: string; destino?: string };
}) {
  const destino = searchParams.destino ?? '/';
  const urlDeIngreso = `/auth/ingresar?destino=${encodeURIComponent(destino)}`;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-sm bg-primario" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">{NOMBRE_APLICACION}</span>
          </div>
          <SelectorTema />
        </div>

        <div className="rounded-lg border border-borde bg-elevado p-6">
          <h1 className="text-lg font-semibold tracking-tight">Informe de Marketing</h1>
          <p className="mt-1 text-xs text-atenuado">{DESCRIPCION_APLICACION}</p>

          {searchParams.error !== undefined ? (
            <Aviso tono="error" className="mt-4">
              {searchParams.error}
            </Aviso>
          ) : null}

          <a href={urlDeIngreso} className={clasesDeBoton('primario', 'normal', 'mt-5 w-full')}>
            Ingresar con la cuenta corporativa
          </a>

          <p className="mt-4 text-micro leading-relaxed text-atenuado">
            El acceso está restringido a las cuentas de Google del dominio de la empresa. Si su
            cuenta es correcta y aun así no puede entrar, solicite el alta a TI.
          </p>
        </div>
      </div>
    </main>
  );
}
