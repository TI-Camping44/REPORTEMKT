-- =====================================================================
-- REPORTEMKT — Bloques vinculados a una planilla de calculo
-- =====================================================================
--
-- Que agrega
--   El origen de datos de cada bloque: manual, como hasta ahora, o una hoja de
--   Google Sheets con su identificador y su rango.
--
-- Por que
--   Tres bloques se copian a mano desde una planilla en cada reunion: la
--   planificacion de pautas, la reasignacion presupuestaria y el NPS. Es
--   trabajo repetido y una fuente de errores de transcripcion. El resto del
--   informe no sale de ninguna planilla y se sigue cargando a mano: la agenda,
--   los hitos, las alertas y los pendientes de Direccion son criterio de
--   Marketing, no un dato que se pueda leer de algun lado.
--
-- Cuando se actualiza, y por que no siempre
--   El contenido leido de la planilla se guarda en `contenido`, igual que si lo
--   hubiera escrito una persona. No se lee la planilla cada vez que alguien
--   abre el informe.
--
--   La razon es que un informe publicado es el registro de lo que se dijo en
--   esa reunion. Si sus numeros cambiaran solos, dentro de seis meses nadie
--   podria abrir el informe de julio y ver lo que Direccion vio en julio.
--
--   Entonces: mientras el informe esta en borrador se refresca, y al publicarlo
--   queda congelado. Esa regla la aplica la aplicacion, no la base.
--
-- Seguridad
--   La planilla se lee con una cuenta de servicio de Google que tiene permiso
--   de lector sobre cada hoja compartida con ella. Su credencial vive en una
--   variable de entorno del servidor y nunca llega al navegador. Aca solo se
--   guarda el identificador de la hoja y el rango, que no son secretos.
-- =====================================================================

create type public.fuente_bloque as enum ('manual', 'planilla');

alter table public.bloques
  add column fuente public.fuente_bloque not null default 'manual',
  -- Identificador de la hoja: el tramo entre /d/ y /edit de su direccion.
  add column fuente_planilla_id text not null default '',
  -- Rango en notacion A1, con el nombre de la pestana: "Pautas!A1:E30".
  add column fuente_rango text not null default '',
  add column fuente_actualizada_en timestamptz,
  -- Ultimo error de lectura, para poder explicarlo en pantalla en lugar de
  -- dejar el bloque en silencio con datos viejos.
  add column fuente_error text not null default '',
  add constraint bloques_fuente_completa
    check (fuente = 'manual' or (fuente_planilla_id <> '' and fuente_rango <> ''));

comment on column public.bloques.fuente is
  'manual: lo escribe Marketing. planilla: se lee de una hoja de Google Sheets.';
comment on constraint bloques_fuente_completa on public.bloques is
  'Un bloque vinculado necesita hoja y rango: sin los dos no hay nada que leer.';

create index bloques_por_fuente on public.bloques (fuente) where fuente <> 'manual';
