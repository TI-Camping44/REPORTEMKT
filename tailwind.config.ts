import type { Config } from 'tailwindcss';

// Los colores se declaran como variables CSS en src/app/globals.css y se exponen
// aca con nombres en espanol para poder escribir bg-fondo, text-texto, bg-primario.
const configuracion: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/componentes/**/*.{ts,tsx}',
    './src/acciones/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fondo: 'rgb(var(--color-fondo) / <alpha-value>)',
        superficie: 'rgb(var(--color-superficie) / <alpha-value>)',
        elevado: 'rgb(var(--color-elevado) / <alpha-value>)',
        texto: 'rgb(var(--color-texto) / <alpha-value>)',
        atenuado: 'rgb(var(--color-atenuado) / <alpha-value>)',
        borde: 'rgb(var(--color-borde) / <alpha-value>)',
        primario: 'rgb(var(--color-primario) / <alpha-value>)',
        'primario-texto': 'rgb(var(--color-primario-texto) / <alpha-value>)',
        'primario-suave': 'rgb(var(--color-primario-suave) / <alpha-value>)',
        exito: 'rgb(var(--color-exito) / <alpha-value>)',
        advertencia: 'rgb(var(--color-advertencia) / <alpha-value>)',
        peligro: 'rgb(var(--color-peligro) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--fuente-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Escala corta, pensada para tablas densas.
        micro: ['0.6875rem', { lineHeight: '1rem' }],
      },
      maxWidth: {
        contenido: '82rem',
      },
    },
  },
  plugins: [],
};

export default configuracion;
