/**
 * Tipos de las filas de la base de datos y de los resultados de las acciones.
 *
 * Se escriben a mano en lugar de generarlos con la CLI de Supabase para que el
 * repositorio no dependa de una herramienta externa. Si cambia una migracion,
 * cambia este archivo en el mismo commit.
 */

import type { EstadoInforme, RolUsuario, TipoPeriodo } from '@/lib/constantes';
import type { ContenidoBloque, TipoBloque } from '@/lib/bloques';

export type Usuario = {
  id: string;
  correo: string;
  nombre: string | null;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
};

export type Empresa = {
  id: string;
  slug: string;
  nombre: string;
  color: string;
  orden: number;
};

export type Tablero = {
  id: string;
  empresa_id: string;
  nombre: string;
  url_insercion: string;
  alto_px: number;
  orden: number;
  activo: boolean;
};

export type Informe = {
  id: string;
  empresa_id: string;
  periodo_tipo: TipoPeriodo;
  periodo_inicio: string;
  periodo_fin: string;
  estado: EstadoInforme;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type Bloque = {
  id: string;
  informe_id: string;
  tipo: TipoBloque;
  orden: number;
  titulo: string;
  contenido: ContenidoBloque;
};

export type Enlace = {
  id: string;
  empresa_id: string;
  titulo: string;
  url: string;
  orden: number;
};

/** Informe con los datos que la vista necesita mostrar de una sola consulta. */
export type InformeConEmpresa = Informe & {
  empresas: Pick<Empresa, 'id' | 'slug' | 'nombre' | 'color'> | null;
};

/**
 * Resultado de toda accion de servidor.
 *
 * El texto de `error` es el que ve la persona: se escribe en espanol claro
 * explicando que hacer, nunca el error crudo de PostgreSQL.
 */
export type ResultadoAccion =
  | { exito: true; mensaje?: string; id?: string }
  | { exito: false; error: string };
