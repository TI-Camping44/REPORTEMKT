-- =====================================================================
-- REPORTEMKT — Secciones dentro del informe y datos de la reunion
-- =====================================================================
--
-- Que agrega
--   La tabla `secciones`, entre `informes` y `bloques`: cada informe se
--   organiza en pestanas y los bloques cuelgan de una pestana, no del informe.
--   Suma ademas al encabezado los datos de la reunion con Gerencia General.
--
-- Por que
--   El informe que Marketing presenta hoy es un documento largo con pestanas
--   arriba: Resumen, la campana en curso, Equipo y Proyectos. Sin secciones,
--   todo eso queda en una sola tira de bloques y obliga a desplazarse hasta el
--   final para llegar a los pendientes de Direccion, que es justamente lo que
--   Direccion viene a mirar.
--
--   El informe sigue siendo uno por empresa: Camping 44 y Vitalica tienen cada
--   una el suyo, con las mismas pestanas. Equipo y Proyectos se repiten en los
--   dos, con el contenido que corresponde a cada empresa; al duplicar el
--   periodo anterior se arrastran, asi que el trabajo repetido es poco.
--
--   El informe pasa ademas a identificarse por su reunion y no por la quincena
--   o el mes. El periodo que cubre se decide en cada reunion y no siempre
--   encaja en un calendario: "julio 2026 + avances al 14/08" no es ni una
--   quincena ni un mes. Las fechas de periodo quedan para ordenar el historial;
--   lo que se muestra es la etiqueta.
--
-- Migracion de lo que ya existe
--   Cada informe actual recibe una seccion "Resumen" y sus bloques pasan a
--   colgar de ella. No se pierde ningun bloque.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. informes: encabezado y reunion
-- ---------------------------------------------------------------------

alter table public.informes
  add column titulo text not null default 'Reporte de Marketing',
  -- Etiqueta libre del periodo, escrita completa por Marketing:
  -- "julio 2026 + avances al 14/08". Vacia: se usa el rotulo calculado.
  add column periodo_etiqueta text not null default '',
  add column reunion_fecha date,
  add column reunion_hora text not null default '',
  add column presenta text not null default '';

comment on column public.informes.periodo_etiqueta is
  'Rotulo del periodo tal como se presenta. Vacio: se calcula a partir de las fechas.';
comment on column public.informes.reunion_hora is
  'Texto libre, por ejemplo "14:00-15:00". No es una hora que se opere, solo se muestra.';

-- Los informes que ya existian no tenian reunion. Se les asigna la fecha de
-- cierre de su periodo, que es la aproximacion mas razonable.
update public.informes set reunion_fecha = periodo_fin where reunion_fecha is null;

alter table public.informes alter column reunion_fecha set not null;

comment on column public.informes.reunion_fecha is
  'Fecha de la reunion con Gerencia General. Junto con la empresa, identifica al informe.';

-- Un informe por empresa y por reunion. El periodo que cubre lo decide cada
-- reunion y puede superponerse con el de la anterior, asi que la unicidad ya no
-- puede ir sobre las fechas del periodo.
alter table public.informes drop constraint informes_periodo_unico;

alter table public.informes
  add constraint informes_reunion_unica unique (empresa_id, reunion_fecha);

comment on constraint informes_reunion_unica on public.informes is
  'Un informe por empresa y por reunion.';

create index informes_por_reunion on public.informes (empresa_id, reunion_fecha desc);

-- ---------------------------------------------------------------------
-- 2. secciones
-- ---------------------------------------------------------------------
--
-- `clave` es el ancla de la pestana en la direccion (#equipo) y por eso va en
-- minusculas y sin espacios. `etiqueta` es el rotulo chico al lado del titulo:
-- "Outdoor · Defensa", "OLIMP Paraguay".
--
-- La seccion no lleva empresa: el informe entero pertenece a una.

create table public.secciones (
  id uuid primary key default gen_random_uuid(),
  informe_id uuid not null references public.informes (id) on delete cascade,
  clave text not null,
  titulo text not null,
  etiqueta text not null default '',
  orden integer not null default 0,
  constraint secciones_clave_en_minusculas check (clave ~ '^[a-z0-9-]+$'),
  constraint secciones_clave_unica unique (informe_id, clave)
);

create index secciones_informe_orden on public.secciones (informe_id, orden);

comment on table public.secciones is
  'Pestanas del informe: Resumen, la campana en curso, Equipo, Proyectos.';

-- Una seccion por informe existente, con los bloques que ya tenia.
insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
select id, 'resumen', 'Resumen', '', 1
from public.informes;

-- ---------------------------------------------------------------------
-- 3. bloques: pasan a colgar de la seccion
-- ---------------------------------------------------------------------

alter table public.bloques add column seccion_id uuid references public.secciones (id) on delete cascade;

update public.bloques b
set seccion_id = s.id
from public.secciones s
where s.informe_id = b.informe_id;

-- Un bloque sin seccion no tiene donde dibujarse.
delete from public.bloques where seccion_id is null;

alter table public.bloques
  alter column seccion_id set not null,
  drop column informe_id;

create index bloques_seccion_orden on public.bloques (seccion_id, orden);

-- ---------------------------------------------------------------------
-- 4. Disparadores de actualizado_en
-- ---------------------------------------------------------------------

-- El disparador que refresca actualizado_en ahora llega al informe por la
-- seccion. Se reescribe entero porque la columna informe_id ya no existe.
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
    select s.informe_id into identificador from public.secciones s where s.id = old.seccion_id;
  else
    select s.informe_id into identificador from public.secciones s where s.id = new.seccion_id;
  end if;

  if identificador is not null then
    update public.informes set actualizado_en = now() where id = identificador;
  end if;

  -- Disparador AFTER: el valor devuelto se ignora.
  return null;
end;
$$;

-- Agregar, quitar o reordenar secciones tambien cambia el informe.
create or replace function public.marcar_actualizacion_por_seccion()
returns trigger
language plpgsql
as $$
declare
  identificador uuid;
begin
  if tg_op = 'DELETE' then
    identificador = old.informe_id;
  else
    identificador = new.informe_id;
  end if;

  update public.informes set actualizado_en = now() where id = identificador;
  return null;
end;
$$;

create trigger secciones_marcar_actualizacion_del_informe
  after insert or update or delete on public.secciones
  for each row execute function public.marcar_actualizacion_por_seccion();

-- ---------------------------------------------------------------------
-- 5. RLS y permisos de la tabla nueva
-- ---------------------------------------------------------------------
--
-- Una tabla nueva sin politicas es un error, no un pendiente. Y sin grant las
-- politicas no llegan a evaluarse.

alter table public.secciones enable row level security;

create policy secciones_lectura on public.secciones
  for select to authenticated
  using (public.usuario_activo());

create policy secciones_escritura on public.secciones
  for all to authenticated
  using (public.puede_editar())
  with check (public.puede_editar());

grant select, insert, update, delete on public.secciones to authenticated;
revoke all on public.secciones from anon;
