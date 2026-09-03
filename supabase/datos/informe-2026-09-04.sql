-- =====================================================================
-- REPORTEMKT — Informes para la reunion del 04/09/2026
-- =====================================================================
--
-- Que hace
--   Crea el informe de agosto 2026 para Camping 44 y para Vitalica,
--   duplicando el de la reunion del 14/08 y con tres diferencias:
--
--     1. Sin el bloque de agenda. Martin pidio sacar la minuta.
--     2. El cuadro de planificacion de pautas de Camping 44 actualizado con
--        los datos de agosto de la planilla de Daniela.
--     3. Vitalica suma su propio cuadro de pautas, que antes no tenia.
--
--   Los informes nacen en BORRADOR: Direccion no los ve hasta que Marketing
--   revise los numeros y los publique.
--
-- Esto NO es una migracion. Es contenido: se ejecuta una vez y despues se
-- edita desde la aplicacion.
--
-- De donde salen los datos de pautas
--   De la planilla "Plan de pautas", pestanas de Camping 44 y de Vitalica,
--   leidas el 03/09/2026. La columna Estado no existe en la planilla: ahi el
--   estado esta en el color de la celda. Se dedujo de la columna Finalizacion:
--   una fecha ya pasada es "Finalizada", "Rechazado" es "Rechazada" y
--   "En proceso" es "En produccion". CONVIENE QUE MARKETING LO REVISE.
--
-- Lo que este script NO puede completar, porque solo lo tiene Marketing:
--   sesiones, consultas, NPS de cierre de agosto, el avance real de la campana
--   Defensa No Letal, y las decisiones nuevas para Direccion. Todo eso queda
--   con los valores del informe anterior y hay que actualizarlo a mano.
-- =====================================================================

do $$
declare
  empresa record;
  seccion record;
  informe_previo uuid;
  informe_nuevo uuid;
  seccion_nueva uuid;
  campanas_camping uuid;
  campanas_vitalica uuid;
  orden_siguiente integer;
begin
  for empresa in select id, slug from public.empresas order by orden loop
    select id into informe_previo
    from public.informes
    where empresa_id = empresa.id
      and reunion_fecha = date '2026-08-14';

    if informe_previo is null then
      raise notice 'Sin informe del 14/08 para %, se omite.', empresa.slug;
      continue;
    end if;

    insert into public.informes (
      empresa_id, titulo, periodo_tipo, periodo_inicio, periodo_fin,
      periodo_etiqueta, reunion_fecha, reunion_hora, presenta, estado, creado_por
    )
    select
      empresa.id, titulo, 'mensual',
      date '2026-08-01', date '2026-08-31',
      'agosto 2026', date '2026-09-04',
      reunion_hora, presenta, 'borrador', creado_por
    from public.informes
    where id = informe_previo
    returning id into informe_nuevo;

    for seccion in
      select * from public.secciones where informe_id = informe_previo order by orden
    loop
      insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
      values (informe_nuevo, seccion.clave, seccion.titulo, seccion.etiqueta, seccion.orden)
      returning id into seccion_nueva;

      -- La agenda no se copia: es la minuta, y se saco del informe.
      insert into public.bloques (
        seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido,
        fuente, fuente_planilla_id, fuente_rango
      )
      select
        seccion_nueva, tipo, orden, titulo, accion_titulo, accion_url, contenido,
        fuente, fuente_planilla_id, fuente_rango
      from public.bloques
      where seccion_id = seccion.id
        and tipo <> 'agenda'
      order by orden;

      if seccion.clave = 'campanas' and empresa.slug = 'camping44' then
        campanas_camping = seccion_nueva;
      end if;
      if seccion.clave = 'campanas' and empresa.slug = 'vitalica' then
        campanas_vitalica = seccion_nueva;
      end if;
    end loop;
  end loop;

  -- ---------------------------------------------------------------
  -- Pautas de agosto — Camping 44
  -- ---------------------------------------------------------------
  if campanas_camping is not null then
    update public.bloques
    set titulo = 'Planificación de pautas · Agosto',
        contenido = '{
      "columnas": [
        { "clave": "campana", "titulo": "Campaña", "alineacion": "izquierda" },
        { "clave": "plataforma", "titulo": "Plataforma", "alineacion": "izquierda" },
        { "clave": "objetivo", "titulo": "Objetivo", "alineacion": "izquierda" },
        { "clave": "presupuesto", "titulo": "Presup.", "alineacion": "derecha" },
        { "clave": "cierre", "titulo": "Cierre", "alineacion": "izquierda" },
        { "clave": "estado", "titulo": "Estado", "alineacion": "izquierda", "formato": "estado",
          "tonos": { "Finalizada": "ok", "Rechazada": "riesgo", "En producción": "pendiente" } }
      ],
      "filas": [
        { "campana": "Campaña Sale", "plataforma": "Instagram", "objetivo": "Mensajes a WhatsApp", "presupuesto": "USD 100", "cierre": "31/07", "estado": "Finalizada" },
        { "campana": "Reel Collab Evento Britimp", "plataforma": "Instagram", "objetivo": "Visitas al perfil", "presupuesto": "USD 100", "cierre": "—", "estado": "Rechazada" },
        { "campana": "Mochilas Doberman", "plataforma": "Instagram", "objetivo": "Mensajes a WhatsApp", "presupuesto": "USD 50", "cierre": "15/08", "estado": "Finalizada" },
        { "campana": "Mochilas Doberman", "plataforma": "TikTok", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "cierre": "—", "estado": "Rechazada" },
        { "campana": "Rally / Carpas", "plataforma": "Instagram", "objetivo": "Mensajes a WhatsApp", "presupuesto": "USD 50", "cierre": "26/08", "estado": "Finalizada" },
        { "campana": "Rally / Carpas", "plataforma": "TikTok", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "cierre": "—", "estado": "En producción" }
      ],
      "total": { "campana": "Total planificado", "plataforma": "—", "objetivo": "—", "presupuesto": "USD 400", "cierre": "—", "estado": "" },
      "nota": "Restricción de Meta: rechazó los anuncios con cuchillos y armas de la Campaña Sale, y no permite anuncios de visita al perfil desde una cuenta de armería (caso Britimp). Falta subir el contenido nuevo de NTK a TikTok para el Rally / Carpas."
    }'::jsonb
    where seccion_id = campanas_camping
      and tipo = 'tabla'
      and titulo like 'Planificación de pautas%';
  end if;

  -- ---------------------------------------------------------------
  -- Pautas de agosto — Vitalica (bloque nuevo)
  -- ---------------------------------------------------------------
  if campanas_vitalica is not null then
    select coalesce(max(orden), 0) + 1 into orden_siguiente
    from public.bloques where seccion_id = campanas_vitalica;

    insert into public.bloques (
      seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido
    ) values (
      campanas_vitalica, 'tabla', orden_siguiente, 'Planificación de pautas · Agosto',
      'Plan de pautas (Daniela)',
      'https://docs.google.com/spreadsheets/d/1JinDRLoDp5QH0t-GmI4B5adqZDzQGW5PxrPmk2Rdlxk/edit',
      '{
        "columnas": [
          { "clave": "campana", "titulo": "Campaña", "alineacion": "izquierda" },
          { "clave": "plataforma", "titulo": "Plataforma", "alineacion": "izquierda" },
          { "clave": "objetivo", "titulo": "Objetivo", "alineacion": "izquierda" },
          { "clave": "presupuesto", "titulo": "Presup.", "alineacion": "derecha" },
          { "clave": "cierre", "titulo": "Cierre", "alineacion": "izquierda" },
          { "clave": "estado", "titulo": "Estado", "alineacion": "izquierda", "formato": "estado",
            "tonos": { "Finalizada": "ok", "En producción": "pendiente" } }
        ],
        "filas": [
          { "campana": "Reel Collab Entrenador Iso+", "plataforma": "Instagram", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "cierre": "09/08", "estado": "Finalizada" },
          { "campana": "Reel Creatina Olimp", "plataforma": "Instagram", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "cierre": "09/08", "estado": "Finalizada" },
          { "campana": "Reel Collab Proteína Olimp", "plataforma": "Instagram", "objetivo": "Visitas al perfil", "presupuesto": "USD 60", "cierre": "15/08", "estado": "Finalizada" },
          { "campana": "Campaña Push Contenidos", "plataforma": "TikTok", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "cierre": "17/08", "estado": "Finalizada" },
          { "campana": "Reels Recaps Eventos", "plataforma": "Instagram", "objetivo": "Visitas al perfil", "presupuesto": "USD 40", "cierre": "—", "estado": "En producción" }
        ],
        "total": { "campana": "Total planificado", "plataforma": "—", "objetivo": "—", "presupuesto": "USD 250", "cierre": "—", "estado": "" },
        "nota": "Los Reels Recaps de Eventos quedan pendientes de vincular el contenido una vez publicado."
      }'::jsonb
    );
  end if;
end;
$$;
