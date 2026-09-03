# REPORTEMKT

Aplicación web interna de Camping 44 S.A. para el informe de Marketing que se
presenta a Gerencia General.

El informe tiene dos clases de contenido y la aplicación las junta en una sola
pantalla, por empresa y por período:

- **Números que ya existen en otro lado** — tráfico web, posicionamiento,
  redes sociales e inversión publicitaria. Los calcula y actualiza Looker
  Studio; la aplicación solo muestra los tableros embebidos. **No** se conecta a
  las API de Google Analytics, Meta Ads ni Metricool, y no dibuja gráficos
  propios: duplicar esa lógica termina en dos números distintos para la misma
  pregunta.
- **Gestión que solo está en la cabeza de Marketing** — estado de las campañas
  con la agencia, decisiones esperando aprobación de Dirección, planificación de
  pautas, acuerdos con influencers, situación del equipo y proyectos en curso.
  Eso se carga a mano, en bloques.

## Stack

| Pieza | Elección |
| --- | --- |
| Framework | Next.js 14 con App Router |
| Lenguaje | TypeScript en modo estricto |
| Estilos | Tailwind CSS con componentes propios escritos a mano |
| Base de datos, autenticación y archivos | Supabase (`@supabase/supabase-js` + `@supabase/ssr`) |
| Migraciones | SQL directo, sin ORM |
| Gestor de paquetes | npm |
| Despliegue | Vercel |

El framework se declara en `vercel.json`, no en la pantalla de ajustes del
proyecto: así la configuración viaja con el repositorio. Si el preset queda en
`null`, Vercel compila bien y después busca una carpeta `public/` que este
proyecto no tiene, y el despliegue falla con *No Output Directory named "public"
found*.

## Instalación local

Requisitos: Node.js 20 o posterior y npm.

```bash
git clone https://github.com/TI-Camping44/REPORTEMKT.git
cd REPORTEMKT
npm install
cp .env.example .env.local   # y complete los valores
npm run dev                  # http://localhost:3000
```

### Variables de entorno

Todas van en `.env.local`, que está en `.gitignore` y no se versiona nunca. En
Vercel se cargan en *Project Settings → Environment Variables*, para los tres
entornos.

| Variable | Para qué sirve | Secreta |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Dirección del proyecto de Supabase | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave publicable. Viaja al navegador; es segura porque todas las tablas tienen RLS | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta. **Ignora RLS.** Solo scripts de mantenimiento, jamás con prefijo `NEXT_PUBLIC_` | Sí |
| `DOMINIO_PERMITIDO` | Dominio de Google Workspace autorizado, sin arroba | No, pero no se escribe en el código |
| `NEXT_PUBLIC_SITE_URL` | Base pública, para armar la dirección de retorno de Google | No |
| `GOOGLE_CUENTA_SERVICIO` | Credencial de la cuenta de servicio que lee las planillas. Opcional | Sí |
| `CRON_SECRET` | Secreto de la tarea diaria que refresca los bloques vinculados. Opcional | Sí |

### Scripts

```bash
npm run dev     # servidor de desarrollo
npm run tipos   # tsc --noEmit
npm run lint    # next lint
npm run build   # compilación de producción
```

Antes de dar algo por terminado, los tres últimos tienen que pasar sin errores.

## Puesta en marcha de la base de datos

Las migraciones están en `supabase/migrations/` y se aplican **en orden
alfabético**.

### 1. Crear el proyecto de Supabase

Al crearlo, en la sección *Security*:

- **Enable Data API**: marcada. Sin eso `@supabase/supabase-js` no consulta nada.
- **Automatically expose new tables**: marcada. Es la red de seguridad contra el
  problema de los `grant` faltantes.
- **Enable automatic RLS**: marcada. Ninguna tabla sin RLS, garantizado por la
  base y no por disciplina.

### 2. Aplicar las migraciones

Desde el *SQL Editor* del panel, pegando cada archivo en orden, o con la CLI de
Supabase:

```bash
supabase link --project-ref <ref-del-proyecto>
supabase db push
```

### 3. Cargar el dominio corporativo

El disparador de PostgreSQL que crea el perfil en el primer ingreso no ve las
variables de entorno de Next.js, así que lee el dominio de la tabla
`configuracion`. La migración deja la fila vacía a propósito: el dominio real no
se versiona.

```sql
update public.configuracion
set valor = 'sudominio.com.py'
where clave = 'dominio_permitido';
```

Tiene que ser **el mismo valor** que `DOMINIO_PERMITIDO`. La pantalla de
administración avisa si los dos no coinciden.

Mientras la fila esté vacía, ningún ingreso nuevo puede completarse: el
disparador rechaza la creación de la cuenta con un mensaje explícito.

### 4. Configurar Google como proveedor

En Supabase, *Authentication → Sign In / Providers → Google*. La *Callback URL*
que muestra esa pantalla se pega en Google Cloud Console → *APIs y servicios →
Credenciales → ID de cliente OAuth de tipo aplicación web*, en «URI de
redirección autorizados». El *Client ID* y el *Client Secret* vuelven al panel de
Supabase.

En *Authentication → URL Configuration*:

- *Site URL*: `http://localhost:3000` en desarrollo, el dominio de Vercel en
  producción.
- *Redirect URLs*: `http://localhost:3000/**` y el equivalente de producción.

### 5. Designar el primer administrador

Todos los perfiles nacen con rol `lector`. El primer administrador se asciende a
mano, una única vez, después de su primer ingreso:

```sql
update public.usuarios
set rol = 'administrador'
where correo = 'persona.de.ti@sudominio.com.py';
```

Desde ahí en adelante los roles se administran en `/administracion`.

### Validar migraciones sin tocar la base real

`supabase/pruebas/preludio-local.sql` levanta en un PostgreSQL vacío las piezas
que Supabase ya trae hechas (el esquema `auth`, `auth.users`, `auth.uid()` y los
roles `anon`, `authenticated`, `service_role`), de modo que las migraciones se
puedan aplicar y probar en local:

```bash
psql "$CADENA_LOCAL" -v ON_ERROR_STOP=1 -f supabase/pruebas/preludio-local.sql
for archivo in supabase/migrations/*.sql; do
  psql "$CADENA_LOCAL" -v ON_ERROR_STOP=1 -f "$archivo"
done
```

No es una migración y no se aplica en Supabase.

## Despliegue en Vercel

1. Importar el repositorio en Vercel. El framework lo declara `vercel.json`; no
   hace falta tocarlo en la interfaz.
2. Cargar las cinco variables de entorno de la tabla de arriba.
3. Desplegar.
4. Con el dominio del despliegue en mano, actualizar `NEXT_PUBLIC_SITE_URL` y
   las *Redirect URLs* de Supabase, y volver a desplegar.

`vercel.json` fija además la región de las funciones en `pdx1` (Oregon), que es
donde está la base de datos. Si el proyecto de Supabase se recrea en otra
región, hay que cambiar ese valor: dejar la aplicación y la base en continentes
distintos agrega una ida y vuelta a cada consulta.

## Seguimiento entre reuniones

Cada informe es la foto de una reunión y no cambia. Lo que no se ve mirando un
informe solo es la evolución, y para eso está `/[empresa]/seguimiento`:

- **Indicadores por reunión** — un indicador por fila, una reunión por columna,
  con la variación entre las dos últimas en que aparece. Los indicadores se
  siguen por su etiqueta, así que renombrar uno corta su serie.
- **Decisiones pendientes** — los puntos marcados como críticos o pendientes,
  con cuántas reuniones llevan sin resolverse. Un pendiente que aparece por
  cuarta vez no se lee igual que uno nuevo.

Se puede acotar a las últimas 3, 6 o 12 reuniones, o verlas todas.

No calcula ninguna métrica ni consulta ninguna API: ordena lo que ya está
escrito en los informes. El panel de tráfico, redes y pauta con su filtro de
fechas es Looker, embebido en cada informe.

## Bloques vinculados a una planilla

> **Hoy está apagado.** La aplicación puede leer un cuadro directamente de una
> hoja de Google, pero eso necesita una credencial de Google que la empresa
> decidió no crear por ahora. Mientras `GOOGLE_CUENTA_SERVICIO` esté vacía, la
> opción **no aparece** en la pantalla de edición y todos los cuadros se cargan
> a mano, con el botón del bloque apuntando a su planilla. Para encenderlo
> alcanza con crear la cuenta de servicio y cargar la variable: no hay que tocar
> código.

Un cuadro puede quedar vinculado a un rango de Google Sheets y llenarse solo.

Se configura por bloque, desde la pantalla de edición: se pega la dirección de
la hoja y el rango (`Pautas!A1:E30`). Solo admiten vínculo los bloques de
**tabla** e **indicadores**; el resto del informe no sale de ninguna planilla.

- **Tabla** — la primera fila del rango son los títulos de las columnas. Una
  fila que empiece con «Total» se toma como fila de totales. Si el título de una
  columna coincide con una que el bloque ya tenía, se conserva su formato, su
  alineación y sus colores de estado: la planilla trae los datos, no el diseño.
- **Indicadores** — la primera fila son encabezados. Hacen falta `etiqueta` y
  `valor`; `formato`, `decimales`, `variacion`, `detalle` y `mejorSiBaja` son
  opcionales.

El rango no tiene que salir perfecto al primer intento: las filas y las columnas
vacías de los bordes se descartan solas, así que una planilla con columna A de
margen o con filas en blanco entre bloques se lee igual.

Antes de guardar el vínculo hay dos botones que evitan configurar a ciegas:
**Ver pestañas**, que lista los nombres reales de las solapas de la hoja, y
**Probar sin guardar**, que lee el rango y dice cuántas filas y columnas trajo
sin tocar el bloque.

**Cuándo se actualiza.** Mientras el informe está en borrador: con el botón
«Actualizar ahora» de cada bloque, con «Actualizar desde las planillas» del
informe entero, y una vez por día con la tarea programada de `vercel.json`.
**Al publicarlo queda congelado**, porque un informe publicado es el registro de
lo que se presentó en esa reunión: si sus números cambiaran solos, nadie podría
abrir el informe de julio y ver lo que Dirección vio en julio.

### Las tres fuentes que se evaluaron

Los tres cuadros se cargan a mano. Queda anotado lo que se averiguó de cada
uno, para no volver a investigarlo si algún día se enciende el vínculo:

| Fuente | Qué se sabe |
| --- | --- |
| **Control presupuestario** | Hoja de Google nativa. El cuadro que va al informe es «Presupuesto por cuenta contable — año completo», en la pestaña *Dashboard*: once filas de números que se recalculan solos. Es el único de los tres donde el vínculo se pagaría |
| **Plan de pautas** | Hoja de Google nativa, con una pestaña por empresa. Su columna «Estado» **no existe como texto**: está en el color de la celda, y la API de Sheets devuelve valores, no colores. Vincular medio cuadro traería la complejidad de las dos formas y las ventajas de ninguna |
| **NPS** | No sale de una planilla. El sitio `ti-camping44.github.io/NPS-REPORTE` no guarda datos: consulta un Apps Script propio, de acceso público, que devuelve el resumen en JSON (puntaje NPS, total de respuestas, promotores, pasivos y detractores con su porcentaje). Son dos números por período: una integración propia no se justifica |

**Pendiente de aclarar con Marketing:** el informe del 14/08 rotula «NPS Camping
44 · 93 %», pero el NPS es un puntaje de −100 a +100, no un porcentaje. En el
tablero de NPS lo que sí es porcentaje es la proporción de promotores. Antes de
automatizar ese número —si algún día se hace— hay que definir cuál de los dos
quiere ver Dirección.

### Puesta en marcha

1. En Google Cloud Console, *APIs y servicios → Biblioteca* → habilitar
   **Google Sheets API**.
2. *Credenciales → Crear credenciales → Cuenta de servicio*. Crear una clave
   **JSON** y guardarla.
3. Compartir cada planilla con el correo de esa cuenta —el que termina en
   `.iam.gserviceaccount.com`— con permiso de **Lector**.
4. Cargar el JSON en `GOOGLE_CUENTA_SERVICIO` y un secreto cualquiera en
   `CRON_SECRET`.

## Modelo de datos

| Tabla | Para qué |
| --- | --- |
| `configuracion` | Ajustes que la base necesita leer. Hoy: el dominio autorizado |
| `usuarios` | Perfil interno: rol y estado. La identidad vive en `auth.users` |
| `empresas` | Camping 44 y Vitálica. Catálogo fijo, no se edita desde la interfaz |
| `tableros` | Informes de Looker por empresa: dirección de inserción y alto |
| `informes` | Un informe por empresa y período, en borrador o publicado |
| `bloques` | El contenido cargado a mano. `contenido` es `jsonb` con forma por tipo |
| `enlaces` | Accesos útiles por empresa |

Todas tienen RLS activo, sus políticas y sus `grant`. Las tres cosas: sin
`grant select, insert, update, delete … to authenticated`, PostgreSQL corta el
acceso antes de evaluar la política y la pantalla queda vacía sin decir por qué.

Lectura para cualquier usuario autenticado y activo; escritura solo para
`editor` y `administrador`. La forma del `jsonb` de cada tipo de bloque está
documentada en el encabezado de la migración que crea la tabla y en
`src/lib/bloques.ts`.

Una migración aplicada en producción no se edita: los cambios van en una
migración nueva.

## Autenticación

Supabase Auth con Google, restringido al dominio corporativo. El dominio se
valida en tres capas y las tres son necesarias:

1. **Parámetro `hd`** en la petición a Google (`src/app/auth/ingresar/route.ts`).
   Evita que Google ofrezca cuentas ajenas. Se puede esquivar editando la URL.
2. **Servidor**: el middleware (`src/middleware.ts`) y la ruta de retorno
   (`src/app/auth/retorno/route.ts`). Cubren el tráfico del navegador, pero
   corren después de que Supabase creó la cuenta.
3. **Disparador en la base** (`manejar_usuario_nuevo`). Es el único que garantiza
   que no quede un registro de un correo ajeno: corre dentro de la misma
   transacción que crea la cuenta, así que si falla no queda nada.

El perfil se crea en el primer ingreso con rol `lector`. Los permisos se
resuelven en RLS, no en la interfaz: ocultar un botón no es un control de
acceso.

## Pantallas

| Ruta | Quién entra | Qué hace |
| --- | --- | --- |
| `/[empresa]` | Todos | Último informe publicado de la empresa |
| `/[empresa]/[informeId]` | Todos | Un informe concreto |
| `/[empresa]/historial` | Todos | Informes anteriores con su estado |
| `/[empresa]/nuevo` | Editor, administrador | Alta de informe, con opción de duplicar el anterior |
| `/[empresa]/[informeId]/editar` | Editor, administrador | Bloques, orden y publicación |
| `/administracion` | Administrador | Usuarios, roles, tableros, enlaces y dominio |

## Formatos

Centralizados en `src/lib/formato.ts`. Ningún componente formatea a mano.

| Dato | Formato | Función |
| --- | --- | --- |
| Fecha | 31/08/2026 | `formatearFecha` |
| Fecha y hora | 31/08/2026 14:30 | `formatearFechaHora` |
| Moneda | Gs. 3.711.850 | `formatearGuaranies` |
| Zona horaria | America/Asuncion | `ZONA_HORARIA` |

Las columnas `date` de PostgreSQL llegan como `"2026-08-31"`. Pasarlas a
`new Date()` las interpreta como UTC y en Asunción se muestran un día antes; por
eso `formato.ts` las ancla al mediodía UTC antes de formatear.
