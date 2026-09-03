import type { ReactNode } from 'react';

import { clases } from '@/lib/utilidades';
import { ETIQUETAS_ESTADO_INFORME, type EstadoInforme, type RolUsuario, ETIQUETAS_ROL_USUARIO } from '@/lib/constantes';
import { ETIQUETAS_ESTADO_HITO, ETIQUETAS_NIVEL_ALERTA, type EstadoHito, type NivelAlerta } from '@/lib/bloques';

const BASE = 'inline-flex items-center rounded-full border px-2 py-0.5 text-micro font-medium leading-none';

export function Etiqueta({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clases(BASE, className)}>{children}</span>;
}

const POR_ESTADO_INFORME: Record<EstadoInforme, string> = {
  borrador: 'border-advertencia/40 bg-advertencia/10 text-advertencia',
  publicado: 'border-exito/40 bg-exito/10 text-exito',
};

export function EtiquetaEstadoInforme({ estado }: { estado: EstadoInforme }) {
  return <Etiqueta className={POR_ESTADO_INFORME[estado]}>{ETIQUETAS_ESTADO_INFORME[estado]}</Etiqueta>;
}

const POR_ESTADO_HITO: Record<EstadoHito, string> = {
  pendiente: 'border-borde bg-superficie text-atenuado',
  en_curso: 'border-primario/40 bg-primario/10 text-primario-texto',
  completado: 'border-exito/40 bg-exito/10 text-exito',
  bloqueado: 'border-peligro/40 bg-peligro/10 text-peligro',
};

export function EtiquetaEstadoHito({ estado }: { estado: EstadoHito }) {
  return <Etiqueta className={POR_ESTADO_HITO[estado]}>{ETIQUETAS_ESTADO_HITO[estado]}</Etiqueta>;
}

const POR_NIVEL_ALERTA: Record<NivelAlerta, string> = {
  informacion: 'border-borde bg-superficie text-atenuado',
  advertencia: 'border-advertencia/40 bg-advertencia/10 text-advertencia',
  critica: 'border-peligro/40 bg-peligro/10 text-peligro',
};

export function EtiquetaNivelAlerta({ nivel }: { nivel: NivelAlerta }) {
  return <Etiqueta className={POR_NIVEL_ALERTA[nivel]}>{ETIQUETAS_NIVEL_ALERTA[nivel]}</Etiqueta>;
}

const POR_ROL: Record<RolUsuario, string> = {
  administrador: 'border-primario/40 bg-primario/10 text-primario-texto',
  editor: 'border-borde bg-superficie text-texto',
  lector: 'border-borde bg-superficie text-atenuado',
};

export function EtiquetaRol({ rol }: { rol: RolUsuario }) {
  return <Etiqueta className={POR_ROL[rol]}>{ETIQUETAS_ROL_USUARIO[rol]}</Etiqueta>;
}
