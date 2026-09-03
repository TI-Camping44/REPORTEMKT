/**
 * Rutas que hay que volver a pedir al servidor despues de una escritura.
 *
 * Vive en lib y no en un archivo "use server" porque un archivo de acciones
 * solo puede exportar funciones asincronas.
 *
 * Se revalida el segmento dinamico completo en lugar de cada direccion
 * concreta: casi toda escritura toca a la vez la vista del informe, la de
 * edicion y el historial, y calcular las tres direcciones exigiria una
 * consulta mas solo para averiguar el slug de la empresa.
 */

import { revalidatePath } from 'next/cache';

export function revalidarInformes(): void {
  revalidatePath('/[empresa]', 'layout');
}

export function revalidarAdministracion(): void {
  revalidatePath('/administracion');
  revalidatePath('/[empresa]', 'layout');
}
