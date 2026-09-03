-- =====================================================================
-- REPORTEMKT — Ajuste de permisos sobre configuracion
-- =====================================================================
--
-- Que agrega
--   Revoca de authenticated los privilegios de insert, delete y truncate sobre
--   public.configuracion, que quedan concedidos por fuera de las migraciones.
--
-- Por que
--   El proyecto de Supabase tiene activada la opcion "Automatically expose new
--   tables", que otorga todos los privilegios a anon y authenticated sobre cada
--   tabla nueva en el momento de crearla. Esa opcion es deseable: es la red de
--   seguridad contra el problema de los grant faltantes, que deja la pantalla
--   vacia sin ningun mensaje. Pero deja permisos mas anchos que los declarados.
--
--   En configuracion eso importa poco en la practica, porque la tabla no tiene
--   politica de insert ni de delete y RLS rechaza igual. Aun asi el permiso
--   efectivo tiene que coincidir con el declarado: si en algun momento se
--   agrega una politica permisiva, el grant de mas se vuelve un agujero que
--   nadie recuerda haber abierto.
--
--   configuracion es un catalogo cerrado: sus filas se crean en la migracion
--   que la define y solo se actualiza su valor. No se dan de alta ni de baja
--   desde la aplicacion.
-- =====================================================================

revoke insert, delete, truncate on public.configuracion from authenticated;

-- Las demas tablas si admiten alta y baja desde la aplicacion, asi que sus
-- privilegios quedan como estan. Se revoca de nuevo sobre anon por si la
-- exposicion automatica volvio a otorgarlos.
revoke all on public.configuracion from anon;
revoke all on public.usuarios      from anon;
revoke all on public.empresas      from anon;
revoke all on public.tableros      from anon;
revoke all on public.informes      from anon;
revoke all on public.bloques       from anon;
revoke all on public.enlaces       from anon;
