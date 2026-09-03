import type { Metadata } from 'next';
import Link from 'next/link';

import { clasesDeBoton } from '@/componentes/boton';
import { NOMBRE_APLICACION } from '@/lib/constantes';

export const metadata: Metadata = {
  title: 'Sin acceso',
};

const MENSAJES: Record<string, { titulo: string; detalle: string }> = {
  dominio: {
    titulo: 'Esa cuenta no pertenece a la empresa',
    detalle:
      'REPORTEMKT solo admite las cuentas de Google del dominio corporativo. Cierre la sesión de la cuenta personal en el navegador y vuelva a ingresar con la cuenta de la empresa.',
  },
  'sin-perfil': {
    titulo: 'Su cuenta todavía no está habilitada',
    detalle:
      'La cuenta se creó correctamente, pero falta que TI le asigne un rol. Solicite el alta indicando su dirección de correo.',
  },
  inactivo: {
    titulo: 'Su cuenta está dada de baja',
    detalle: 'TI desactivó el acceso de esta cuenta. Si cree que es un error, solicite la reactivación.',
  },
  'solo-lectura': {
    titulo: 'No tiene permiso para editar informes',
    detalle:
      'La edición está reservada a Marketing. Puede consultar los informes publicados desde la pantalla principal.',
  },
  'solo-administracion': {
    titulo: 'La administración es exclusiva de TI',
    detalle: 'Si necesita cambiar un rol o cargar la dirección de un tablero, solicíteselo a TI.',
  },
};

const POR_DEFECTO = {
  titulo: 'No tiene acceso a esta pantalla',
  detalle: 'Si cree que es un error, solicite el alta o el cambio de rol a TI.',
};

export default function PaginaSinAcceso({ searchParams }: { searchParams: { motivo?: string } }) {
  const mensaje = MENSAJES[searchParams.motivo ?? ''] ?? POR_DEFECTO;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm bg-primario" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight">{NOMBRE_APLICACION}</span>
        </div>

        <div className="rounded-lg border border-borde bg-elevado p-6">
          <h1 className="text-lg font-semibold tracking-tight">{mensaje.titulo}</h1>
          <p className="mt-2 text-sm leading-relaxed text-atenuado">{mensaje.detalle}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/" className={clasesDeBoton('secundario')}>
              Volver al inicio
            </Link>
            <form action="/auth/salir" method="post">
              <button type="submit" className={clasesDeBoton('sutil')}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
