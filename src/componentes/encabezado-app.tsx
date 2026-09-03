import Link from 'next/link';

import { SelectorTema } from '@/componentes/selector-tema';
import { clasesDeBoton } from '@/componentes/boton';
import { NOMBRE_APLICACION } from '@/lib/constantes';
import { esAdministrador } from '@/lib/permisos';
import { clases } from '@/lib/utilidades';
import type { Empresa, Usuario } from '@/lib/tipos';

export function EncabezadoApp({
  empresas,
  slugActual,
  usuario,
  correo,
}: {
  empresas: Empresa[];
  slugActual: string | null;
  usuario: Usuario;
  correo: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-fondo/95 backdrop-blur">
      <div className="mx-auto flex max-w-contenido flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm bg-primario" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">{NOMBRE_APLICACION}</span>
        </Link>

        <nav aria-label="Empresas" className="flex items-center gap-1">
          {empresas.map((empresa) => {
            const activa = empresa.slug === slugActual;
            return (
              <Link
                key={empresa.id}
                href={`/${empresa.slug}`}
                aria-current={activa ? 'page' : undefined}
                className={clases(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
                  activa ? 'bg-superficie font-medium text-texto' : 'text-atenuado hover:text-texto',
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: empresa.color }}
                />
                {empresa.nombre}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          {slugActual !== null ? (
            <>
              <Link
                href={`/${slugActual}/seguimiento`}
                className="rounded-md px-2 py-1 text-xs text-atenuado transition-colors hover:text-texto"
              >
                Seguimiento
              </Link>
              <Link
                href={`/${slugActual}/historial`}
                className="rounded-md px-2 py-1 text-xs text-atenuado transition-colors hover:text-texto"
              >
                Historial
              </Link>
            </>
          ) : null}

          {esAdministrador(usuario.rol) ? (
            <Link
              href="/administracion"
              className="rounded-md px-2 py-1 text-xs text-atenuado transition-colors hover:text-texto"
            >
              Administración
            </Link>
          ) : null}

          <SelectorTema />

          <div className="flex items-center gap-2 border-s border-borde ps-2">
            <span className="hidden text-micro leading-tight text-atenuado sm:block">
              {usuario.nombre ?? correo}
            </span>
            <form action="/auth/salir" method="post">
              <button type="submit" className={clasesDeBoton('sutil', 'chico')}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
