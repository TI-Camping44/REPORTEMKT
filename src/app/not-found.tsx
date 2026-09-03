import Link from 'next/link';

import { clasesDeBoton } from '@/componentes/boton';
import { NOMBRE_APLICACION } from '@/lib/constantes';

export default function PaginaNoEncontrada() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm bg-primario" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">{NOMBRE_APLICACION}</span>
        </div>

        <div className="rounded-lg border border-borde bg-elevado p-6">
          <h1 className="text-lg font-semibold tracking-tight">No encontramos esa pantalla</h1>
          <p className="mt-2 text-sm leading-relaxed text-atenuado">
            La dirección no existe, o el informe que buscaba fue eliminado.
          </p>
          <Link href="/" className={clasesDeBoton('secundario', 'normal', 'mt-5')}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
