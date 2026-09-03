# CLAUDE.md — Convenciones de REPORTEMKT

Instrucciones para las sesiones siguientes. Se leen antes de escribir código.

## Qué es y qué no es

REPORTEMKT junta, por empresa y por período, dos clases de contenido: los
tableros de Looker Studio embebidos y la gestión que Marketing carga a mano.

**No entra, y no se agrega aunque parezca una mejora obvia:** conexión a las API
de Google Analytics, Meta Ads o Metricool; cálculo de métricas; generación de
gráficos propios. Todo eso lo hace Looker Studio. Duplicarlo acá significa
mantener dos veces la misma lógica y terminar con dos números distintos para la
misma pregunta.

Si un bloque de indicadores muestra un número grande con su variación, es texto
con formato, no un SVG.

## Idioma

Todo en español, sin excepción y sin mezclar: interfaz, mensajes de error,
comentarios de código, nombres de tablas y columnas, nombres de variables y
componentes, mensajes de commit.

Registro neutro, **sin voseo rioplatense**. Se escribe «use», «ingrese»,
«complete»; nunca «usá», «ingresá», «completá». Esto lo lee Dirección.

Los términos técnicos sin traducción establecida quedan como están: middleware,
commit, bucket, hook.

## Nombres

| Concepto | Se escribe |
| --- | --- |
| Componente de React | PascalCase en español: `TarjetaIndicador` |
| Función o variable | camelCase en español: `formatearGuaranies` |
| Archivo | kebab-case en español: `bloque-indicadores.tsx` |
| Tabla y columna SQL | snake_case sin tildes: `informes`, `periodo_inicio` |
| Tipo enumerado SQL | snake_case singular: `estado_informe` |
| Constante exportada | MAYUSCULAS_CON_GUION: `ALTO_TABLERO_POR_DEFECTO` |

Los identificadores de SQL van sin tildes ni eñes para no tener que
entrecomillarlos. El texto que ve la persona sí las lleva. Los comentarios de
código y de SQL van sin tildes para que ningún archivo dependa de la
codificación del editor; el texto de la interfaz sí las usa.

## Marca y formato

| Elemento | Valor |
| --- | --- |
| Rojo institucional | `#E01E37` |
| Gris tinta | `#14161B` |
| Tipografía | Inter, mediante `next/font/google` |

Los colores se declaran como variables CSS en `src/app/globals.css` y se exponen
en Tailwind con nombres en español: `bg-fondo`, `text-texto`, `bg-primario`,
`border-borde`, `bg-superficie`, `bg-elevado`, `text-atenuado`.

Interfaz sobria y densa en información. Dirección la mira en pantalla grande: el
dato pesa más que la decoración. Tipografía chica en tablas, espaciado ajustado,
sin ilustraciones.

Responsive obligatorio, y modo claro y oscuro en todas las pantallas con
`next-themes`.

Los formatos van centralizados en `src/lib/formato.ts` y no se formatea a mano en
ningún componente. Las columnas `date` se anclan al mediodía UTC antes de
formatear: si se pasan a `new Date()` tal cual, en Asunción se muestran un día
antes.

## Arquitectura

- **Componentes de servidor** consultan datos. Es el modo por defecto. Las
  consultas viven en `src/lib/datos.ts`. `obtenerInformeCompleto` trae el
  informe con sus secciones, bloques, tableros y enlaces en varias consultas y
  no en una anidada: PostgREST devuelve las relaciones anidadas sin garantía de
  orden, y acá el orden de secciones y bloques es lo que define el documento.
- **Componentes de cliente** (`"use client"`) manejan interacción y estado.
  Reciben los datos por propiedades; no consultan Supabase salvo para
  autenticación.
- **Acciones de servidor** (`"use server"`, en `src/acciones/`) hacen las
  escrituras y **siempre** devuelven:

  ```ts
  export type ResultadoAccion =
    | { exito: true; mensaje?: string; id?: string }
    | { exito: false; error: string };
  ```

  El mensaje de error es el que ve la persona: en español claro, explicando qué
  hacer, nunca el error crudo de PostgreSQL. La traducción está en
  `src/lib/errores.ts`.

- Un archivo `"use server"` **solo puede exportar funciones asíncronas**. Las
  constantes y las reglas sincronas compartidas entre servidor y cliente van en
  `src/lib/`.

- **Tres clientes de Supabase, separados a propósito:**
  - `src/lib/supabase/servidor.ts` — opera con la sesión de la persona, RLS se
    aplica. Es el que se usa siempre.
  - `src/lib/supabase/navegador.ts` — solo autenticación.
  - `src/lib/supabase/administrador.ts` — ignora RLS, únicamente para scripts.
    **La clave de servicio nunca atiende una petición de la interfaz.**

- Se valida en la acción de servidor antes de escribir, y además con
  restricciones `CHECK` en la base. La validación del navegador es comodidad, no
  control.

- Todo botón que dispara una acción de servidor va con estado cargando, no con
  `disabled`: un botón apagado y sin señal de avance se lee como roto. Use
  `BotonAccion` (`src/componentes/boton-accion.tsx`) o replique su patrón.

## Base de datos

Migraciones en `supabase/migrations/`, con el nombre
`AAAAMMDDHHMMSS_descripcion_en_espanol.sql`, aplicadas en orden alfabético. Cada
archivo abre con un encabezado que explica qué agrega y por qué.

**Estructura del informe:** `informes` → `secciones` → `bloques`. Hay un informe
por empresa y por reunión con Gerencia General; cada informe se organiza en
secciones, que son las pestañas de arriba, y los bloques cuelgan de una sección.
`informes.reunion_fecha` es lo que identifica al informe junto con la empresa:
el período que cubre lo decide cada reunión y no siempre encaja en una quincena
o un mes, por eso `periodo_etiqueta` se escribe completo («julio 2026 + avances
al 14/08») y las fechas de período solo ordenan el historial.

**Una migración aplicada en producción no se edita: los cambios van en una
migración nueva.**

Para cada tabla, sin excepción:

- **RLS activo.** Una tabla nueva sin políticas es un error, no un pendiente.
- **Y su `grant`.** Las políticas no alcanzan: sin
  `grant select, insert, update, delete … to authenticated`, PostgreSQL corta
  antes de evaluarlas y la pantalla queda vacía sin decir por qué. Es de los
  errores más difíciles de diagnosticar.
- **Disparador `marcar_actualizacion()`** donde haya `actualizado_en`.

Políticas: lectura para cualquier usuario autenticado y activo; escritura solo
para `editor` y `administrador`. Las funciones de apoyo (`rol_actual()`,
`es_administrador()`, `puede_editar()`, `usuario_activo()`) van `SECURITY
DEFINER` con `search_path = public`; sin eso, consultar `usuarios` dentro de la
política de `usuarios` provoca recursión infinita.

La forma del `jsonb` de cada tipo de bloque se documenta en **dos** lugares que
tienen que coincidir: el encabezado de
`20260903170200_documentar_bloques_y_agregar_accion.sql` y `src/lib/bloques.ts`.
Si cambia una, cambia la otra en el mismo commit. Un `jsonb` sin forma escrita en
algún lado es un campo libre que en seis meses nadie sabe leer.

Los diez tipos de bloque: `indicadores`, `agenda`, `linea_tiempo`, `alertas`,
`hitos`, `tabla`, `calendario`, `fichas`, `texto`, `enlaces`. Los chips de color
no tienen niveles fijos: el texto lo escribe Marketing («Aprobada», «Decidir ya»,
«Pausado») y el `tono` decide el color, entre `ok`, `curso`, `pendiente`,
`riesgo`, `pausa` y `neutro`. Todo bloque puede llevar además un botón a un
documento externo en su encabezado (`accion_titulo` y `accion_url`).

Tildar un punto de la agenda **se guarda**: es la constancia de que el tema se
trató. Como escribir exige rol de editor, quien presenta tilda y Dirección lo ve
marcado sin poder cambiarlo.

## El iframe de Looker Studio

Cuatro cosas que se rompen si no se respetan (`src/componentes/tablero-looker.tsx`):

1. La URL sale de `url_insercion`. Si está vacía, se muestra un recuadro que
   dice que el tablero está pendiente de configuración. **No se dibuja un iframe
   con `src` vacío.**
2. El atributo `sandbox` va con
   `allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox`
   (constante `PERMISOS_TABLERO`).
3. Siempre un botón «Abrir en pestaña nueva» al lado. En navegadores que
   bloquean cookies de terceros el informe embebido puede pedir sesión de
   Google, y ese botón es la única salida.
4. El informe de Looker **no es adaptable**: se dibuja al ancho con el que fue
   diseñado. Se respeta `alto_px` y no se intenta hacerlo responsivo por CSS. En
   pantalla chica va dentro de un contenedor con desplazamiento horizontal
   propio; el cuerpo de la página nunca se desplaza en horizontal.

## Autenticación

El dominio se valida en tres capas y las tres son necesarias: `hd` en la
petición a Google, middleware y ruta de retorno en el servidor, y disparador en
la base. Ninguna sola alcanza.

`DOMINIO_PERMITIDO` nunca se escribe en el código. El disparador de PostgreSQL no
ve las variables de entorno, así que lee el dominio de la tabla `configuracion`;
los dos valores tienen que coincidir y la pantalla de administración avisa si no.

## Seguridad

- Ninguna credencial en el repositorio. Todo por `.env.local`, con `.env.example`
  documentado y `.env.local` en `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` jamás con prefijo `NEXT_PUBLIC_`.
- No se usa `localStorage` para la sesión; la administra Supabase.

## Antes de dar algo por terminado

```bash
npm run tipos && npm run lint && npm run build
```

Los tres sin errores. Para cambios de esquema, **aplique las migraciones contra
una base real**; no alcanza con que el SQL «se vea bien». Si no hay base a mano,
`supabase/pruebas/preludio-local.sql` levanta el andamiaje de Supabase en un
PostgreSQL vacío y permite probar las migraciones, las políticas RLS y los
disparadores en local.

### En sesiones de Claude Code en la web

El contenedor viene con `NODE_ENV=development` fijado, y eso hace que
`next build` cargue el runtime de desarrollo y falle al prerenderizar con
`Cannot read properties of null (reading 'useContext')`. No es un defecto del
proyecto. Compile así:

```bash
NODE_ENV=production npm run build
```

En Vercel y en una máquina normal, `npm run build` alcanza.

## Forma de trabajo

Commits chicos y descriptivos, en español. Primera línea en imperativo, sin
punto final; después un cuerpo que explique el porqué.

Al modificar un archivo existente, se entrega el archivo completo, no un parche
parcial.

No se inventan requerimientos. Si falta información para decidir algo, se
pregunta antes de asumir.
