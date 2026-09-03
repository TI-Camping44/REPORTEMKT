/** Utilidades chicas y sin dependencias. */

/** Une clases de Tailwind descartando las vacias, false, null y undefined. */
export function clases(...valores: Array<string | false | null | undefined>): string {
  return valores.filter((valor): valor is string => typeof valor === 'string' && valor !== '').join(' ');
}
