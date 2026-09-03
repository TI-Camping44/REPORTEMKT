/** Reglas sincronas sobre las direcciones de los tableros de Looker Studio. */

/**
 * Convierte la direccion de insercion en la direccion para abrir el informe en
 * una pestana nueva.
 *
 * Looker entrega dos formas de la misma direccion:
 *   insercion: https://lookerstudio.google.com/embed/reporting/<id>/page/<p>
 *   normal:    https://lookerstudio.google.com/reporting/<id>/page/<p>
 *
 * El boton de pestana nueva tiene que llevar a la segunda: la primera, abierta
 * sola, muestra el informe sin la barra de Looker y sin la opcion de ingresar
 * con otra cuenta, que es justamente lo que se necesita cuando el navegador
 * bloquea las cookies de terceros.
 */
export function urlParaPestanaNueva(urlInsercion: string): string {
  return urlInsercion.replace('/embed/reporting/', '/reporting/');
}

export function tableroEstaConfigurado(urlInsercion: string | null | undefined): boolean {
  return typeof urlInsercion === 'string' && urlInsercion.trim() !== '';
}
