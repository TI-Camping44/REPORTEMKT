import type { Metadata } from 'next';

import { FormularioDominio } from '@/componentes/administracion/formulario-dominio';
import { TablaEnlaces } from '@/componentes/administracion/tabla-enlaces';
import { TablaTableros } from '@/componentes/administracion/tabla-tableros';
import { TablaUsuarios } from '@/componentes/administracion/tabla-usuarios';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { CLAVE_DOMINIO_PERMITIDO } from '@/lib/constantes';
import {
  listarEmpresas,
  listarTodosLosEnlaces,
  listarTodosLosTableros,
  listarUsuarios,
  obtenerConfiguracion,
} from '@/lib/datos';
import { requerirAdministrador } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Administración' };

export default async function PaginaDeAdministracion() {
  const { usuario } = await requerirAdministrador();

  const [usuarios, empresas, tableros, enlaces, dominioEnLaBase] = await Promise.all([
    listarUsuarios(),
    listarEmpresas(),
    listarTodosLosTableros(),
    listarTodosLosEnlaces(),
    obtenerConfiguracion(CLAVE_DOMINIO_PERMITIDO),
  ]);

  // Se compara con la variable de entorno para detectar la desincronizacion
  // entre las capas de validacion, que de otro modo se descubre el dia que
  // alguien no puede ingresar.
  const dominioDeLaAplicacion = (process.env.DOMINIO_PERMITIDO ?? '').trim().toLowerCase();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Administración</h1>
        <p className="mt-0.5 text-xs text-atenuado">
          Alta y baja de usuarios, roles, y configuración de los tableros de Looker Studio.
        </p>
      </header>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Dominio corporativo"
          descripcion="Tercera capa de validación: la base rechaza la creación de cualquier cuenta de otro dominio."
        />
        <CuerpoTarjeta>
          <FormularioDominio
            dominioEnLaBase={dominioEnLaBase}
            coincideConLaAplicacion={dominioEnLaBase === dominioDeLaAplicacion}
          />
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Usuarios"
          descripcion={`${usuarios.length} perfil${usuarios.length === 1 ? '' : 'es'} · administrador: TI · editor: Marketing · lector: Dirección`}
        />
        <CuerpoTarjeta>
          <TablaUsuarios usuarios={usuarios} idPropio={usuario.id} />
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Tableros de Looker Studio"
          descripcion="La aplicación no calcula estas métricas: solo muestra el informe que Looker actualiza solo."
        />
        <CuerpoTarjeta>
          <TablaTableros tableros={tableros} empresas={empresas} />
        </CuerpoTarjeta>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Enlaces útiles"
          descripcion="Aparecen al final del informe de cada empresa."
        />
        <CuerpoTarjeta>
          <TablaEnlaces empresas={empresas} enlaces={enlaces} />
        </CuerpoTarjeta>
      </Tarjeta>
    </div>
  );
}
