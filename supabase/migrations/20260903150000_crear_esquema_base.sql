-- =====================================================================
-- REPORTEMKT — Esquema base
-- =====================================================================
--
-- Que agrega
--   Los tipos enumerados, las siete tablas del modelo y el disparador que
--   mantiene al dia la columna actualizado_en.
--
-- Por que
--   El informe mensual de Marketing junta dos clases de contenido: numeros que
--   ya viven en Looker Studio (aca solo se guarda la direccion del tablero) y
--   gestion que hoy solo esta en la cabeza de Marketing (campanas, decisiones
--   pendientes, acuerdos con influencers). Esta migracion crea el lugar donde
--   se guarda la segunda clase, que es la que no sale de ninguna API.
--
-- Convenciones
--   Los identificadores de SQL van en snake_case, sin tildes ni enies, para no
--   tener que entrecomillarlos. El texto que ve la persona si las lleva.
--
-- Esta migracion no crea politicas RLS: eso va en la migracion siguiente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------

-- administrador: TI. editor: Marketing. lector: Direccion.
create type public.rol_usuario as enum ('administrador', 'editor', 'lector');

create type public.periodo_informe as enum ('quincenal', 'mensual');

create type public.estado_informe as enum ('borrador', 'publicado');

create type public.tipo_bloque as enum (
  'indicadores',
  'hitos',
  'tabla',
  'alertas',
  'texto',
  'enlaces'
);

-- ---------------------------------------------------------------------
-- Funcion de apoyo: mantener actualizado_en
-- ---------------------------------------------------------------------

create or replace function public.marcar_actualizacion()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

comment on function public.marcar_actualizacion() is
  'Disparador BEFORE UPDATE: pone actualizado_en en la hora actual.';

-- ---------------------------------------------------------------------
-- configuracion
-- ---------------------------------------------------------------------
--
-- Ajustes que la base necesita conocer y que no pueden llegar por variable de
-- entorno, porque un disparador de PostgreSQL no ve el entorno de Next.js.
-- Hoy tiene una sola fila: el dominio corporativo autorizado a ingresar.
--
-- Se deja vacia a proposito. El valor real no se versiona: lo carga TI despues
-- de aplicar las migraciones, siguiendo el README.

create table public.configuracion (
  clave text primary key,
  valor text not null default '',
  descripcion text not null default '',
  actualizado_en timestamptz not null default now()
);

comment on table public.configuracion is
  'Ajustes leidos desde la base. El dominio permitido vive aca porque lo consulta un disparador.';

insert into public.configuracion (clave, valor, descripcion) values
  (
    'dominio_permitido',
    '',
    'Dominio de Google Workspace autorizado a ingresar, sin arroba. Ejemplo: empresa.com.py'
  );

create trigger configuracion_marcar_actualizacion
  before update on public.configuracion
  for each row execute function public.marcar_actualizacion();

-- ---------------------------------------------------------------------
-- usuarios
-- ---------------------------------------------------------------------
--
-- Perfil de la aplicacion. La identidad la administra auth.users; aca solo se
-- guarda el rol y si la persona sigue habilitada. El perfil se crea solo en el
-- primer ingreso, con rol lector, mediante el disparador de la tercera
-- migracion.

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  correo text not null unique,
  nombre text,
  rol public.rol_usuario not null default 'lector',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint usuarios_correo_con_arroba check (correo like '%@%')
);

comment on table public.usuarios is
  'Perfil interno: rol y estado de cada persona. La identidad vive en auth.users.';
comment on column public.usuarios.activo is
  'En false la persona conserva la cuenta de Google pero no ve nada: las politicas RLS lo exigen.';

-- ---------------------------------------------------------------------
-- empresas
-- ---------------------------------------------------------------------
--
-- Camping 44 y Vitalica. No es un catalogo que se edite desde la interfaz: las
-- dos filas se cargan en la migracion de datos iniciales.

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  color text not null default '#E01E37',
  orden integer not null default 0,
  constraint empresas_slug_en_minusculas check (slug ~ '^[a-z0-9-]+$'),
  constraint empresas_color_hexadecimal check (color ~* '^#[0-9a-f]{6}$')
);

comment on table public.empresas is
  'Las dos unidades de negocio sobre las que se informa.';

-- ---------------------------------------------------------------------
-- tableros
-- ---------------------------------------------------------------------
--
-- Informes de Looker Studio embebidos. La aplicacion no calcula ninguna de las
-- metricas que muestran: solo guarda la direccion de insercion y el alto con el
-- que hay que dibujar el iframe.
--
-- url_insercion admite cadena vacia porque los tableros todavia no existen. La
-- vista tiene que verse bien sin ellos, mostrando un recuadro de pendiente en
-- lugar de un iframe con src vacio.

create table public.tableros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre text not null,
  url_insercion text not null default '',
  alto_px integer not null default 1200,
  orden integer not null default 0,
  activo boolean not null default true,
  constraint tableros_alto_razonable check (alto_px between 300 and 6000),
  constraint tableros_url_vacia_o_segura check (url_insercion = '' or url_insercion ~ '^https://')
);

create index tableros_empresa_orden on public.tableros (empresa_id, orden);

comment on column public.tableros.alto_px is
  'Alto del iframe. El informe de Looker no es adaptable: se dibuja al ancho con el que fue disenado.';

-- ---------------------------------------------------------------------
-- informes
-- ---------------------------------------------------------------------
--
-- Un informe por empresa y periodo. Publicado es la foto de ese periodo y no se
-- reescribe.

create table public.informes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  periodo_tipo public.periodo_informe not null,
  periodo_inicio date not null,
  periodo_fin date not null,
  estado public.estado_informe not null default 'borrador',
  creado_por uuid references public.usuarios (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint informes_periodo_coherente check (periodo_fin >= periodo_inicio),
  constraint informes_periodo_unico unique (empresa_id, periodo_tipo, periodo_inicio)
);

create index informes_empresa_periodo on public.informes (empresa_id, periodo_inicio desc);

comment on constraint informes_periodo_unico on public.informes is
  'No puede haber dos informes para la misma quincena de la misma empresa.';

create trigger informes_marcar_actualizacion
  before update on public.informes
  for each row execute function public.marcar_actualizacion();

-- ---------------------------------------------------------------------
-- bloques
-- ---------------------------------------------------------------------
--
-- El contenido cargado a mano. `contenido` es jsonb y su forma depende de
-- `tipo`. La misma forma esta declarada en TypeScript en src/lib/bloques.ts:
-- si cambia una, cambia la otra en el mismo commit.
--
--   indicadores
--     { "indicadores": [ { "etiqueta": "Sesiones",
--                          "valor": "18432",
--                          "formato": "numero" | "guaranies" | "porcentaje" | "texto",
--                          "decimales": 0,
--                          "variacion": 12.4,        -- porcentual, puede ser null
--                          "mejorSiBaja": false,     -- true en costos
--                          "detalle": "vs. julio" } ] }
--
--   hitos
--     { "hitos": [ { "titulo": "Campana Dia del Padre",
--                    "detalle": "Cerrada con la agencia",
--                    "estado": "pendiente" | "en_curso" | "completado" | "bloqueado",
--                    "responsable": "Agencia",
--                    "fecha": "2026-08-20" } ] }
--
--   tabla
--     { "columnas": [ { "clave": "medio",
--                       "titulo": "Medio",
--                       "alineacion": "izquierda" | "centro" | "derecha",
--                       "formato": "texto" | "numero" | "guaranies" | "porcentaje",
--                       "decimales": 0 } ],
--       "filas": [ { "medio": "Meta Ads" } ],
--       "nota": "Texto al pie del cuadro" }
--
--   alertas
--     { "alertas": [ { "nivel": "informacion" | "advertencia" | "critica",
--                      "titulo": "Falta aprobacion del presupuesto",
--                      "detalle": "Esperando a Direccion desde el 12/08" } ] }
--
--   texto
--     { "texto": "Parrafos separados por una linea en blanco. No es Markdown." }
--
--   enlaces
--     { "enlaces": [ { "titulo": "Planilla de pautas",
--                      "url": "https://...",
--                      "detalle": "Actualizada al cierre" } ] }
--
-- El orden no lleva restriccion de unicidad: reordenar bloques exigiria un
-- baile de valores intermedios para no chocar. Se ordena por (orden, id).

create table public.bloques (
  id uuid primary key default gen_random_uuid(),
  informe_id uuid not null references public.informes (id) on delete cascade,
  tipo public.tipo_bloque not null,
  orden integer not null default 0,
  titulo text not null default '',
  contenido jsonb not null default '{}'::jsonb,
  constraint bloques_contenido_es_objeto check (jsonb_typeof(contenido) = 'object')
);

create index bloques_informe_orden on public.bloques (informe_id, orden);

-- Al tocar un bloque cambia el informe, aunque la fila de informes no se toque.
-- El encabezado muestra la fecha de ultima actualizacion y tiene que reflejarlo.
create or replace function public.marcar_actualizacion_del_informe()
returns trigger
language plpgsql
as $$
declare
  identificador uuid;
begin
  -- En un disparador DELETE la variable new no esta asignada y leerla es un
  -- error, asi que se elige la fila segun la operacion en lugar de coalesce.
  if tg_op = 'DELETE' then
    identificador = old.informe_id;
  else
    identificador = new.informe_id;
  end if;

  update public.informes set actualizado_en = now() where id = identificador;

  -- Disparador AFTER: el valor devuelto se ignora.
  return null;
end;
$$;

create trigger bloques_marcar_actualizacion_del_informe
  after insert or update or delete on public.bloques
  for each row execute function public.marcar_actualizacion_del_informe();

-- ---------------------------------------------------------------------
-- enlaces
-- ---------------------------------------------------------------------
--
-- Accesos utiles por empresa: planilla de pautas, control presupuestario,
-- informe de NPS. Son fijos de la empresa, no del periodo.

create table public.enlaces (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  titulo text not null,
  url text not null,
  orden integer not null default 0,
  constraint enlaces_url_absoluta check (url ~ '^https?://')
);

create index enlaces_empresa_orden on public.enlaces (empresa_id, orden);
