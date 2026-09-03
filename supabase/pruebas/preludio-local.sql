-- =====================================================================
-- REPORTEMKT — Preludio para validar las migraciones en una base local
-- =====================================================================
--
-- Este archivo NO es una migracion y no se aplica en Supabase. Solo sirve para
-- levantar en un PostgreSQL vacio las piezas que Supabase ya trae hechas, de
-- modo que las migraciones de supabase/migrations/ se puedan aplicar y probar
-- sin tocar la base real.
--
-- Uso:
--   psql "$CADENA_LOCAL" -f supabase/pruebas/preludio-local.sql
--   for archivo in supabase/migrations/*.sql; do psql "$CADENA_LOCAL" -v ON_ERROR_STOP=1 -f "$archivo"; done
-- =====================================================================

create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;

-- Version reducida de auth.users: solo las columnas que usa el disparador.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- auth.uid() lee el reclamo `sub` del token. En local se simula con un ajuste
-- de sesion, que es como lo hace Supabase por debajo.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
