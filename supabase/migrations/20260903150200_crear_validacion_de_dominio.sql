-- =====================================================================
-- REPORTEMKT — Validacion del dominio corporativo al crear la cuenta
-- =====================================================================
--
-- Que agrega
--   El disparador sobre auth.users que crea el perfil de la aplicacion en el
--   primer ingreso y rechaza cualquier correo ajeno al dominio corporativo.
--
-- Por que
--   El dominio se valida en tres capas y las tres hacen falta:
--
--     1. El parametro hd en la peticion a Google, que evita mostrar el selector
--        de cuentas ajenas. Se puede esquivar editando la URL.
--     2. El middleware y la ruta de retorno de la autenticacion, del lado del
--        servidor. Cubren el trafico normal, pero corren despues de que Supabase
--        ya creo la cuenta.
--     3. Este disparador. Es el unico que garantiza que no quede un registro de
--        un correo ajeno en la base, porque corre dentro de la misma
--        transaccion que crea la cuenta: si falla, no queda nada.
--
--   El dominio no se escribe aca. Se lee de la tabla configuracion, que TI
--   carga despues de aplicar las migraciones. Un disparador de PostgreSQL no ve
--   las variables de entorno de Next.js, asi que DOMINIO_PERMITIDO no le sirve.
-- =====================================================================

create or replace function public.dominio_permitido_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(valor))
  from public.configuracion
  where clave = 'dominio_permitido';
$$;

comment on function public.dominio_permitido_actual() is
  'Dominio corporativo autorizado, leido de la tabla configuracion.';

create or replace function public.manejar_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dominio_autorizado text;
  correo_normalizado text;
  nombre_de_google text;
begin
  correo_normalizado = lower(trim(coalesce(new.email, '')));
  dominio_autorizado = coalesce(public.dominio_permitido_actual(), '');

  if dominio_autorizado = '' then
    raise exception
      'El dominio corporativo no esta configurado. Cargue la fila dominio_permitido de la tabla configuracion antes del primer ingreso.'
      using errcode = 'check_violation';
  end if;

  if correo_normalizado = '' or split_part(correo_normalizado, '@', 2) <> dominio_autorizado then
    raise exception
      'La cuenta % no pertenece al dominio autorizado.', correo_normalizado
      using errcode = 'check_violation';
  end if;

  nombre_de_google = nullif(
    trim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      )
    ),
    ''
  );

  -- El perfil nace con rol lector. El administrador lo ajusta despues desde
  -- la pantalla de administracion.
  insert into public.usuarios (id, correo, nombre, rol)
  values (new.id, correo_normalizado, nombre_de_google, 'lector')
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.manejar_usuario_nuevo() is
  'Crea el perfil en el primer ingreso y rechaza correos ajenos al dominio corporativo.';

drop trigger if exists usuarios_al_crear_cuenta on auth.users;

create trigger usuarios_al_crear_cuenta
  after insert on auth.users
  for each row execute function public.manejar_usuario_nuevo();
