/**
 * Secciones con las que nace un informe que no duplica a ninguno.
 *
 * Siguen la forma del informe que Marketing presenta hoy. No estan fijadas en
 * la base a proposito: se pueden agregar, quitar y reordenar desde la edicion,
 * y cada empresa puede terminar con pestanas distintas.
 */

export type SeccionInicial = {
  clave: string;
  titulo: string;
  etiqueta: string;
};

export const SECCIONES_POR_DEFECTO: SeccionInicial[] = [
  { clave: 'resumen', titulo: 'Resumen', etiqueta: '' },
  { clave: 'campanas', titulo: 'Campañas y pauta', etiqueta: '' },
  { clave: 'equipo', titulo: 'Equipo', etiqueta: '' },
  { clave: 'proyectos', titulo: 'Proyectos', etiqueta: '' },
];

/** Convierte un titulo en una clave valida para el ancla de la pestana. */
export function claveDesdeTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
