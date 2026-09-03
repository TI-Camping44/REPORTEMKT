-- =====================================================================
-- REPORTEMKT — Funciones de apoyo, RLS y permisos
-- =====================================================================
--
-- Que agrega
--   Las funciones que resuelven el rol de quien consulta, la activacion de RLS
--   en las siete tablas, sus politicas y los grants correspondientes.
--
-- Por que
--   Los permisos se resuelven en la base, no en la interfaz. Ocultar un boton
--   no es un control de acceso: quien tenga la clave publica puede consultar la
--   API de Supabase directamente.
--
-- Dos detalles que cuestan horas si se pasan por alto:
--
--   1. Las funciones van SECURITY DEFINER con search_path = public. Sin eso,
--      consultar public.usuarios dentro de la politica de public.usuarios
--      provoca recursion infinita: la politica llama a la funcion, la funcion
--      consulta la tabla, la tabla vuelve a evaluar la politica. Con SECURITY
--      DEFINER la consulta corre como el dueno de la tabla, que no evalua RLS.
--
--   2. Las politicas no alcanzan por si solas. Sin grant select, insert,
--      update, delete ... to authenticated, PostgreSQL corta el acceso antes de
--      llegar a evaluar la politica y la pantalla queda vacia sin decir por
--      que. Es de los errores mas dificiles de diagnosticar, porque el SQL
--      "se ve bien".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------------

create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select u.rol
  from public.usuarios u
  where u.id = auth.uid()
    and u.activo;
$$;

comment on function public.rol_actual() is
  'Rol de quien hace la consulta, o null si no tiene perfil o esta dado de baja.';

create or replace function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.activo
  );
$$;

comment on function public.usuario_activo() is
  'Verdadero cuando quien consulta tiene perfil y sigue habilitado.';

create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.rol_actual() = 'administrador', false);
$$;

create or replace function public.puede_editar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.rol_actual() in ('editor', 'administrador'), false);
$$;

comment on function public.puede_editar() is
  'Verdadero para editor (Marketing) y administrador (TI). Los lectores solo consultan.';

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.configuracion enable row level security;
alter table public.usuarios     enable row level security;
alter table public.empresas     enable row level security;
alter table public.tableros     enable row level security;
alter table public.informes     enable row level security;
alter table public.bloques      enable row level security;
alter table public.enlaces      enable row level security;

-- configuracion ---------------------------------------------------------
-- La lee cualquier persona habilitada; la escribe solo TI.

create policy configuracion_lectura on public.configuracion
  for select to authenticated
  using (public.usuario_activo());

create policy configuracion_escritura on public.configuracion
  for update to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- usuarios --------------------------------------------------------------
-- Cada persona ve su propio perfil, para que la aplicacion pueda resolver su
-- rol aun antes de que un administrador la habilite. El listado completo es
-- exclusivo de TI.

create policy usuarios_lectura_propia on public.usuarios
  for select to authenticated
  using (id = auth.uid());

create policy usuarios_lectura_administrador on public.usuarios
  for select to authenticated
  using (public.es_administrador());

create policy usuarios_alta_administrador on public.usuarios
  for insert to authenticated
  with check (public.es_administrador());

create policy usuarios_edicion_administrador on public.usuarios
  for update to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

create policy usuarios_baja_administrador on public.usuarios
  for delete to authenticated
  using (public.es_administrador());

-- empresas --------------------------------------------------------------
-- Catalogo fijo: se carga en la migracion de datos iniciales y no se edita
-- desde la interfaz. Se deja la escritura en manos de TI por si hay que
-- corregir un nombre o un color.

create policy empresas_lectura on public.empresas
  for select to authenticated
  using (public.usuario_activo());

create policy empresas_escritura on public.empresas
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- tableros --------------------------------------------------------------

create policy tableros_lectura on public.tableros
  for select to authenticated
  using (public.usuario_activo());

create policy tableros_escritura on public.tableros
  for all to authenticated
  using (public.puede_editar())
  with check (public.puede_editar());

-- informes --------------------------------------------------------------

create policy informes_lectura on public.informes
  for select to authenticated
  using (public.usuario_activo());

create policy informes_escritura on public.informes
  for all to authenticated
  using (public.puede_editar())
  with check (public.puede_editar());

-- bloques ---------------------------------------------------------------

create policy bloques_lectura on public.bloques
  for select to authenticated
  using (public.usuario_activo());

create policy bloques_escritura on public.bloques
  for all to authenticated
  using (public.puede_editar())
  with check (public.puede_editar());

-- enlaces ---------------------------------------------------------------

create policy enlaces_lectura on public.enlaces
  for select to authenticated
  using (public.usuario_activo());

create policy enlaces_escritura on public.enlaces
  for all to authenticated
  using (public.puede_editar())
  with check (public.puede_editar());

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
--
-- Sin estos grants las politicas de arriba no llegan a evaluarse nunca.

grant usage on schema public to authenticated;

grant select on public.configuracion to authenticated;
grant update on public.configuracion to authenticated;

grant select, insert, update, delete on public.usuarios to authenticated;
grant select, insert, update, delete on public.empresas to authenticated;
grant select, insert, update, delete on public.tableros to authenticated;
grant select, insert, update, delete on public.informes to authenticated;
grant select, insert, update, delete on public.bloques  to authenticated;
grant select, insert, update, delete on public.enlaces  to authenticated;

grant execute on function public.rol_actual()      to authenticated;
grant execute on function public.usuario_activo()  to authenticated;
grant execute on function public.es_administrador() to authenticated;
grant execute on function public.puede_editar()    to authenticated;

-- La aplicacion no tiene ninguna pantalla publica: sin sesion no se ve nada.
-- Se revoca de forma explicita para que la clave publicable no pueda ni
-- intentar la consulta, aunque las politicas ya la rechazarian.

revoke all on public.configuracion from anon;
revoke all on public.usuarios      from anon;
revoke all on public.empresas      from anon;
revoke all on public.tableros      from anon;
revoke all on public.informes      from anon;
revoke all on public.bloques       from anon;
revoke all on public.enlaces       from anon;
