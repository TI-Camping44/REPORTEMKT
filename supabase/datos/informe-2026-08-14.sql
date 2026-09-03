-- =====================================================================
-- REPORTEMKT — Contenido real de la reunion del 14/08/2026
-- =====================================================================
--
-- Que hace
--   Borra el informe de ejemplo con datos inventados y carga los dos informes
--   reales de la reunion Marketing-GG del 14 de agosto de 2026, uno para
--   Camping 44 y otro para Vitalica, con el contenido del tablero que preparo
--   Martin Benitez.
--
--   Rehace ademas los enlaces utiles de cada empresa con la lista que Martin
--   mantiene en su documento de enlaces.
--
-- Esto NO es una migracion y no va en supabase/migrations/.
--   Las migraciones definen la estructura y se aplican en todos los entornos.
--   Esto es contenido de negocio: se ejecuta una sola vez, a mano, y despues se
--   edita desde la aplicacion como cualquier otro informe.
--
-- Se ejecuta entero, de una sola vez, desde el SQL Editor.
--
-- Que queda pendiente de completar desde la aplicacion
--   - Los tableros de Looker no existen todavia (tarea MKT-0538): url_insercion
--     sigue vacia y la vista muestra el recuadro de pendiente. En el documento
--     de Martin son las entradas "Redes sociales y web" de cada empresa.
--   - Sin direccion todavia, tambien del documento de Martin:
--     Camping 44 "Base de datos de clientes", Vitalica "Embajadores".
--     Se cargan desde /administracion cuando existan.
-- =====================================================================

do $$
declare
  empresa_camping uuid;
  empresa_vitalica uuid;
  informe_camping uuid;
  informe_vitalica uuid;
  seccion uuid;
begin
  select id into empresa_camping from public.empresas where slug = 'camping44';
  select id into empresa_vitalica from public.empresas where slug = 'vitalica';

  if empresa_camping is null or empresa_vitalica is null then
    raise exception 'Faltan las empresas. Aplique primero las migraciones.';
  end if;

  -- ---------------------------------------------------------------
  -- Fuera el informe de ejemplo: sus numeros son inventados y a esta
  -- altura solo confunden.
  -- ---------------------------------------------------------------
  delete from public.informes
  where empresa_id = empresa_camping
    and reunion_fecha = date '2026-08-31'
    and creado_por is null
    and periodo_etiqueta = '';

  -- ---------------------------------------------------------------
  -- Enlaces utiles, segun el documento que mantiene Martin.
  -- Se rehacen enteros para que la aplicacion y ese documento no queden
  -- diciendo cosas distintas.
  -- ---------------------------------------------------------------
  delete from public.enlaces where empresa_id in (empresa_camping, empresa_vitalica);

  insert into public.enlaces (empresa_id, titulo, url, orden) values
    (empresa_camping, 'NPS', 'https://ti-camping44.github.io/NPS-REPORTE/', 1),
    (empresa_camping, 'Leads CRM', 'https://crm.neuralgenius.tech/reports', 2),
    (empresa_camping, 'Tablero de Marketing',
     'https://script.google.com/a/macros/camping44.com.py/s/AKfycbwFbrMH9e09811aXm1K46GDSON1sNbUdddW21P8A4cSv7AzjKq3Ly04QnILaYnQ1Iewvw/exec', 3),
    (empresa_vitalica, 'Calendario de eventos y activaciones',
     'https://docs.google.com/presentation/d/1FUcAi2wzziH4X365sl9Aj5cyfgcUSUoZViTaPFk0pQI/edit', 1),
    (empresa_vitalica, 'Nutricionistas',
     'https://docs.google.com/spreadsheets/d/1S2pvmMCrKQxpnVuH45I6_ewV5sFhAFGI10Lq42k97ns/edit', 2),
    -- Google Analytics no se puede embeber: bloquea el encuadre en otro sitio.
    -- Va como enlace hasta que exista el tablero de Looker de la tarea MKT-0538.
    (empresa_vitalica, 'Google Analytics',
     'https://analytics.google.com/analytics/web/#/a384780653p524954337/reports/reportinghub', 3),
    (empresa_vitalica, 'Tablero de Marketing',
     'https://script.google.com/a/macros/camping44.com.py/s/AKfycbwFbrMH9e09811aXm1K46GDSON1sNbUdddW21P8A4cSv7AzjKq3Ly04QnILaYnQ1Iewvw/exec', 4);

  -- Los tableros de Looker todavia no existen. Se les da el nombre con el que
  -- Martin los tiene anotados, para que la pantalla de administracion diga a
  -- que corresponde cada direccion cuando haya que cargarla.
  update public.tableros set nombre = 'Redes sociales y web — Camping 44' where empresa_id = empresa_camping;
  update public.tableros set nombre = 'Redes sociales y web — Vitálica' where empresa_id = empresa_vitalica;

  -- =================================================================
  -- CAMPING 44
  -- =================================================================
  insert into public.informes (
    empresa_id, titulo, periodo_tipo, periodo_inicio, periodo_fin,
    periodo_etiqueta, reunion_fecha, reunion_hora, presenta, estado, creado_por
  ) values (
    empresa_camping,
    'Reporte de Marketing',
    'mensual',
    date '2026-07-01',
    date '2026-08-14',
    'julio 2026 + avances al 14/08',
    date '2026-08-14',
    '14:00–15:00',
    'Martín Benítez',
    'publicado',
    null
  )
  returning id into informe_camping;

  -- ---- Resumen --------------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_camping, 'resumen', 'Resumen', '', 1)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'agenda', 1, 'Agenda de la reunión', '', '',
    '{
      "introduccion": "Según la minuta de la reunión del 23/07 más los puntos agregados por Dirección. Se tilda cada tema a medida que se trata.",
      "puntos": [
        { "texto": "Reporte en tablero dinámico — compromiso de la minuta: se cumple presentando este informe.", "origen": "Minuta 23/07", "tratado": false },
        { "texto": "Campaña Defensa No Letal — Gs. 20 M aprobados (Luminaria); propuesta creativa 21/08; primeras gráficas 10/09.", "origen": "Minuta 23/07", "tratado": false },
        { "texto": "Página web aprobada: Gs. 5.138.000 · 25 días hábiles. Kick-off lunes 17/08 14:00 con Analía; entrega estimada 21/09.", "origen": "Minuta 23/07", "tratado": false },
        { "texto": "Vitálica — pauta activa desde 29/07 (Meta, Google, TikTok con planner); calendario de eventos de agosto; embajadores (Isabela firmó). Venta en gimnasios sigue pausada: estado de la búsqueda del vendedor.", "origen": "Minuta 23/07", "tratado": false },
        { "texto": "Bolsa de entrega Vitálica y C44 — presupuesto de proveedor recibido. Decisión: aprobar.", "origen": "Pedido de Dirección", "tratado": false },
        { "texto": "CRM — en marcha con Jhamyl; Vitálica avanzando y reunión con Neural la semana próxima por Camping 44.", "origen": "Pedido de Dirección", "tratado": false },
        { "texto": "Factura Luminaria — factura 001-001-0000064 derivada a Roque y Ariel; el pago se ejecuta hoy.", "origen": "Informativo", "tratado": false },
        { "texto": "Tablero de tareas de Marketing — ticket a TI creado y resuelto: el área ya tiene su tablero dinámico de gestión.", "origen": "Informativo", "tratado": false }
      ]
    }'::jsonb
  ),
  (
    seccion, 'indicadores', 2, 'Resumen ejecutivo', '', '',
    '{
      "indicadores": [
        { "etiqueta": "Campaña Defensa No Letal", "valor": "20000000", "formato": "guaranies", "detalle": "Presupuesto aprobado, IVA incluido · Agencia Luminaria · propuesta creativa 21/08" },
        { "etiqueta": "Página web con Porta", "valor": "5138000", "formato": "guaranies", "detalle": "Aprobada · 25 días hábiles · entrega estimada 21/09" },
        { "etiqueta": "NPS Camping 44", "valor": "93", "formato": "porcentaje", "decimales": 0, "detalle": "Cierre de julio · agosto en curso: 91 %" }
      ]
    }'::jsonb
  );

  -- ---- Campañas y pauta ------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_camping, 'campanas', 'Campañas y pauta', 'Outdoor · Defensa', 2)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'linea_tiempo', 1, 'Campaña Defensa No Letal · «No toda amenaza necesita una bala»', '', '',
    '{
      "pasos": [
        { "fecha": "07/08", "titulo": "Presupuesto aprobado — Gs. 20 M IVA incluido (Luminaria)", "estado": "hecho" },
        { "fecha": "08/08", "titulo": "Confirmación formal a la agencia", "estado": "hecho" },
        { "fecha": "21/08", "titulo": "Presentación de propuesta creativa", "estado": "actual" },
        { "fecha": "10/09", "titulo": "Salida de primeras gráficas", "estado": "proximo" },
        { "fecha": "Sept–Oct", "titulo": "Campaña 360° al aire", "estado": "proximo" }
      ]
    }'::jsonb
  ),
  (
    seccion, 'alertas', 2, 'Estado general', '', '',
    '{
      "alertas": [
        { "tono": "ok", "etiqueta": "Aprobada", "titulo": "Web nueva con Porta — Gs. 5.138.000 · 25 días hábiles", "detalle": "Kick-off lunes 17/08 a las 14:00 con Analía. Entrega estimada: 21/09." },
        { "tono": "riesgo", "etiqueta": "Atención", "titulo": "La web necesita actualización de productos e información antes de la campaña de Google", "detalle": "Las primeras gráficas salen el 10/09, once días antes de que la web esté lista." },
        { "tono": "ok", "etiqueta": "Activa", "titulo": "Pautas corriendo en Instagram y TikTok durante todo agosto", "detalle": "", "enlaces": [
          { "titulo": "Pauta 1", "url": "https://www.instagram.com/p/DbleHw_lPGa/" },
          { "titulo": "Pauta 2", "url": "https://www.instagram.com/p/Dbtb7fXFKJn/" },
          { "titulo": "Pauta 3", "url": "https://www.instagram.com/p/Db5miaZxJiP/" }
        ] },
        { "tono": "curso", "etiqueta": "En curso", "titulo": "Tablero de redes y orgánico en elaboración", "detalle": "Proyecto aparte. Se integra acá cuando esté terminado." }
      ]
    }'::jsonb
  ),
  (
    seccion, 'indicadores', 3, 'NPS — Voz del cliente',
    'Ver informe NPS en vivo', 'https://ti-camping44.github.io/NPS-REPORTE/',
    '{
      "indicadores": [
        { "etiqueta": "Julio (cierre)", "valor": "93", "formato": "porcentaje", "decimales": 0 },
        { "etiqueta": "Agosto (en curso)", "valor": "91", "formato": "porcentaje", "decimales": 0 }
      ]
    }'::jsonb
  ),
  (
    seccion, 'texto', 4, 'Seguimiento del NPS', '', '',
    '{ "texto": "Detractor del 03/08 (score 3) identificado y en seguimiento con Jhamyl. Reportar el cierre mensual en Sofidya." }'::jsonb
  ),
  (
    seccion, 'tabla', 5, 'Planificación de pautas · Agosto',
    'Plan de pautas (Daniela)',
    'https://docs.google.com/spreadsheets/d/1JinDRLoDp5QH0t-GmI4B5adqZDzQGW5PxrPmk2Rdlxk/edit?gid=649387614#gid=649387614',
    '{
      "columnas": [
        { "clave": "campana", "titulo": "Campaña", "alineacion": "izquierda" },
        { "clave": "plataforma", "titulo": "Plataforma", "alineacion": "izquierda" },
        { "clave": "objetivo", "titulo": "Objetivo", "alineacion": "izquierda" },
        { "clave": "presupuesto", "titulo": "Presup.", "alineacion": "derecha" },
        { "clave": "estado", "titulo": "Estado", "alineacion": "izquierda", "formato": "estado",
          "tonos": { "Finalizada 31/07": "ok", "Activa · hasta 15/08": "ok", "En producción": "pendiente", "Rechazada": "riesgo" } }
      ],
      "filas": [
        { "campana": "Campaña Sale", "plataforma": "Instagram", "objetivo": "Mensajes a WhatsApp", "presupuesto": "USD 100", "estado": "Finalizada 31/07" },
        { "campana": "Mochilas Doberman", "plataforma": "Instagram", "objetivo": "Mensajes a WhatsApp", "presupuesto": "USD 50", "estado": "Activa · hasta 15/08" },
        { "campana": "Mochilas Doberman", "plataforma": "TikTok", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "estado": "Activa · hasta 15/08" },
        { "campana": "Rally / Carpas", "plataforma": "Instagram", "objetivo": "Mensajes a WhatsApp", "presupuesto": "USD 50", "estado": "En producción" },
        { "campana": "Rally / Carpas", "plataforma": "TikTok", "objetivo": "Visitas al perfil", "presupuesto": "USD 50", "estado": "En producción" },
        { "campana": "Reel Collab Evento Britimp", "plataforma": "Instagram", "objetivo": "Visitas al perfil", "presupuesto": "USD 100", "estado": "Rechazada" }
      ],
      "total": { "campana": "Total planificado", "plataforma": "—", "objetivo": "—", "presupuesto": "USD 400", "estado": "" },
      "nota": "Restricción: Meta rechazó los anuncios con cuchillos y armas de la Campaña Sale, y no permite anuncios de visita al perfil desde una cuenta de armería (caso Britimp). El plan se reorienta a productos sin restricción (mochilas, carpas, camping) y a TikTok."
    }'::jsonb
  ),
  (
    seccion, 'texto', 6, 'Reasignación presupuestaria',
    'Control presupuestario 2026',
    'https://docs.google.com/spreadsheets/d/1Da7QOoQQClgyc5D_6B6VT9q9xpFv0AIK/edit?gid=944493842#gid=944493842',
    '{ "texto": "Planilla de control presupuestario de Camping 44: seguimiento de partidas, ejecución y reasignación entre rubros de marketing.\n\nÚltima actualización de la planilla: 11/08/2026." }'::jsonb
  );

  -- ---- Equipo -----------------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_camping, 'equipo', 'Equipo', '', 3)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'tabla', 1, 'Equipo de Marketing',
    'Tablero de tareas del equipo',
    'https://script.google.com/a/macros/camping44.com.py/s/AKfycbwFbrMH9e09811aXm1K46GDSON1sNbUdddW21P8A4cSv7AzjKq3Ly04QnILaYnQ1Iewvw/exec',
    '{
      "columnas": [
        { "clave": "puesto", "titulo": "Puesto", "alineacion": "izquierda" },
        { "clave": "situacion", "titulo": "Situación", "alineacion": "izquierda", "formato": "estado",
          "tonos": { "Vacaciones": "pausa", "Búsqueda": "pendiente", "Pendiente": "pendiente" } },
        { "clave": "detalle", "titulo": "Detalle", "alineacion": "izquierda" }
      ],
      "filas": [
        { "puesto": "Diseño", "situacion": "Vacaciones", "detalle": "De vacaciones, se reincorpora el 19/08. Cobertura de piezas urgentes vía agencia hasta esa fecha." },
        { "puesto": "Analista de Marketing", "situacion": "Búsqueda", "detalle": "Proceso de selección en curso: 1 candidato llegó a instancia de entrevista. PCR ya compartido con Dirección." },
        { "puesto": "Encargado de Contenidos", "situacion": "Búsqueda", "detalle": "Proceso de selección en curso: 1 candidato llegó a instancia de entrevista. PCR ya compartido con Dirección." }
      ]
    }'::jsonb
  );

  -- ---- Proyectos --------------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_camping, 'proyectos', 'Proyectos', '', 4)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'tabla', 1, 'Proyectos y pendientes de Dirección', '', '',
    '{
      "columnas": [
        { "clave": "tema", "titulo": "Tema", "alineacion": "izquierda" },
        { "clave": "estado", "titulo": "Estado", "alineacion": "izquierda", "formato": "estado",
          "tonos": { "En plan": "curso", "Aprobada · en ejecución": "ok", "Decisión": "riesgo", "En curso": "curso", "En elaboración": "pendiente" } },
        { "clave": "detalle", "titulo": "Detalle", "alineacion": "izquierda" },
        { "clave": "direccion", "titulo": "Necesita de Dirección", "alineacion": "izquierda" }
      ],
      "filas": [
        { "tema": "Campaña Defensa No Letal", "estado": "En plan", "detalle": "Gs. 20 M aprobados. Propuesta creativa 21/08, gráficas 10/09.", "direccion": "—" },
        { "tema": "Web con Porta", "estado": "Aprobada · en ejecución", "detalle": "Gs. 5.138.000 · 25 días hábiles. Reunión de cronograma con Analía el lunes 17/08 a las 14:00. Entrega estimada: lunes 21/09. Atención: las primeras gráficas de la campaña salen el 10/09, once días antes de que la web esté lista.", "direccion": "—" },
        { "tema": "Bolsa de entrega Vitálica y C44", "estado": "Decisión", "detalle": "Presupuesto de proveedor recibido. Diseño a definir.", "direccion": "Aprobar presupuesto" },
        { "tema": "CRM — número Vitálica", "estado": "En curso", "detalle": "En marcha con Jhamyl. Vitálica ya en trabajo; reunión con Neural la semana próxima para cerrar la configuración de Camping 44.", "direccion": "—" },
        { "tema": "Reporte Olimp Q2", "estado": "En elaboración", "detalle": "Fecha de entrega propuesta pendiente de definir.", "direccion": "Validar fecha" }
      ]
    }'::jsonb
  );

  -- =================================================================
  -- VITALICA
  -- =================================================================
  insert into public.informes (
    empresa_id, titulo, periodo_tipo, periodo_inicio, periodo_fin,
    periodo_etiqueta, reunion_fecha, reunion_hora, presenta, estado, creado_por
  ) values (
    empresa_vitalica,
    'Reporte de Marketing',
    'mensual',
    date '2026-07-01',
    date '2026-08-14',
    'julio 2026 + avances al 14/08',
    date '2026-08-14',
    '14:00–15:00',
    'Martín Benítez',
    'publicado',
    null
  )
  returning id into informe_vitalica;

  -- ---- Resumen ----------------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_vitalica, 'resumen', 'Resumen', '', 1)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'indicadores', 1, 'Resumen ejecutivo', '', '',
    '{
      "indicadores": [
        { "etiqueta": "Pauta digital", "valor": "3800000", "formato": "guaranies", "detalle": "Inversión de julio (Meta). Agosto en curso, multiplataforma con planner." },
        { "etiqueta": "Influencers", "valor": "5", "formato": "numero", "detalle": "4 activos (Isabela ya firmó) · 1 pendiente de firma (Astrid) · 2 sin contrato firmado" }
      ]
    }'::jsonb
  );

  -- ---- Campañas y pauta -------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_vitalica, 'campanas', 'Campañas y pauta', 'OLIMP Paraguay', 2)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'hitos', 1, 'Hitos del período', '', '',
    '{
      "hitos": [
        { "titulo": "Planner digital activa desde el 29/07", "detalle": "Daniela Frutos. Plataformas configuradas y verificadas.", "estado": "completado", "responsable": "Marketing", "fecha": "2026-07-29" },
        { "titulo": "Arquetipos de clientes entregados a la planner", "detalle": "Para segmentación.", "estado": "completado", "responsable": "Marketing", "fecha": "2026-08-03" },
        { "titulo": "TikTok Ads: incidente con la tarjeta resuelto", "detalle": "Queda en modalidad prepago. Se recomienda mantenerla.", "estado": "completado", "responsable": "Marketing", "fecha": null },
        { "titulo": "Isabela Olcese: contrato de embajadora firmado", "detalle": "Arranca la producción de contenidos.", "estado": "completado", "responsable": "Marketing", "fecha": "2026-08-12" },
        { "titulo": "Acuerdo Olimp / El Negro", "detalle": "DOOH y banner de e-commerce funcionando. Góndola en corrección.", "estado": "en_curso", "responsable": "Marketing", "fecha": null }
      ]
    }'::jsonb
  ),
  (
    seccion, 'alertas', 2, 'Alertas', '', '',
    '{
      "alertas": [
        { "tono": "riesgo", "etiqueta": "Decidir ya", "titulo": "BIGG Coffee Run — sábado 22/08, 08:00 a 11:00", "detalle": "Propuesta de participación: fee de Gs. 1.500.000 más montaje y productos a cargo de Vitálica. 150 corredores. «Road to BIGG Under Armour Running Festival». Incluye cobertura audiovisual, after movie y contenido propio de marca. Faltan 8 días: hay que revisar la presentación y confirmar." },
        { "tono": "pendiente", "etiqueta": "Pendiente", "titulo": "Distribución final de inversión por plataforma", "detalle": "" },
        { "tono": "pendiente", "etiqueta": "Pendiente", "titulo": "Aprobación de contenidos de campaña", "detalle": "" },
        { "tono": "pausa", "etiqueta": "Pausado", "titulo": "Venta en gimnasios", "detalle": "Detenida hasta incorporar al nuevo vendedor." },
        { "tono": "curso", "etiqueta": "En curso", "titulo": "CRM Vitálica en trabajo con Jhamyl", "detalle": "Reunión con Neural la semana próxima por la configuración de Camping 44." }
      ]
    }'::jsonb
  ),
  (
    seccion, 'calendario', 3, 'Calendario de eventos y activaciones',
    'Ver calendario completo',
    'https://docs.google.com/presentation/d/1FUcAi2wzziH4X365sl9Aj5cyfgcUSUoZViTaPFk0pQI/edit',
    '{
      "mes": "2026-08",
      "eventos": [
        { "dia": 8, "nombre": "Bigg Running Lab", "tipo": "activacion" },
        { "dia": 16, "nombre": "GTC", "tipo": "evento" },
        { "dia": 22, "nombre": "Bigg en el Delta", "tipo": "evento" },
        { "dia": 27, "nombre": "Degustación de proteínas — Negro Suplementos", "tipo": "activacion" }
      ],
      "proximos": [
        { "fecha": "15/09", "nombre": "Live & Burn" },
        { "fecha": "26–28/09", "nombre": "MBarete CrossFit" },
        { "fecha": "11/10", "nombre": "Carrera de Bigg" }
      ]
    }'::jsonb
  ),
  (
    seccion, 'fichas', 4, 'Influencers · programa Vitálica', '', '',
    '{
      "introduccion": "Toque una tarjeta para ver el detalle de cada acuerdo: quién es, tipo de acuerdo, qué se hizo y próximos pasos.",
      "fichas": [
        { "nombre": "Isabela Olcese", "rol": "Embajadora de marca", "marca": "Vitálica", "tono": "ok", "estado": "Activa",
          "campos": [
            { "etiqueta": "Tipo de acuerdo", "valor": "Contrato de embajadora, firmado" },
            { "etiqueta": "Qué se hizo", "valor": "Contrato firmado, gestión vía Bernardo Sosa, el 12/08." },
            { "etiqueta": "Próximo paso", "valor": "Arranca la producción de contenidos: definir calendario." }
          ],
          "materiales": [] },
        { "nombre": "Alexander", "rol": "Coach / Entrenador", "marca": "Vitálica", "tono": "ok", "estado": "Activo",
          "campos": [
            { "etiqueta": "Tipo de acuerdo", "valor": "Recomendación de productos" },
            { "etiqueta": "Qué se hizo", "valor": "Se le envió material de apoyo para uso y recomendación de productos el 03/08." },
            { "etiqueta": "Próximo paso", "valor": "Seguimiento del uso del material y de las primeras recomendaciones." }
          ],
          "materiales": [ { "titulo": "Contenido publicado en Instagram", "url": "https://www.instagram.com/p/DbTkynExfSQ/" } ] },
        { "nombre": "Marcos Reinaldi", "rol": "Influencer", "marca": "", "tono": "ok", "estado": "Activo",
          "campos": [
            { "etiqueta": "Qué se hizo", "valor": "Ya está activo generando contenidos. Video para redes grabado." },
            { "etiqueta": "Próximo paso", "valor": "Publicación del video grabado." }
          ],
          "materiales": [] },
        { "nombre": "Astrid Runner", "rol": "Influencer", "marca": "", "tono": "pendiente", "estado": "Pendiente de firma",
          "campos": [
            { "etiqueta": "Qué se hizo", "valor": "Acuerdo cerrado. Falta que venga a firmar el contrato." },
            { "etiqueta": "Próximo paso", "valor": "Coordinar día y hora de firma." }
          ],
          "materiales": [] },
        { "nombre": "Dudu Vargas", "rol": "Influencer", "marca": "", "tono": "curso", "estado": "Activo · sin firma",
          "campos": [
            { "etiqueta": "Qué se hizo", "valor": "Ya está activo generando contenidos." },
            { "etiqueta": "Próximo paso", "valor": "Regularizar la firma del contrato." }
          ],
          "materiales": [ { "titulo": "Contenido publicado en Instagram", "url": "https://www.instagram.com/p/DbWhCfaCthb/" } ] }
      ]
    }'::jsonb
  );

  -- ---- Equipo ------------------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_vitalica, 'equipo', 'Equipo', '', 3)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'tabla', 1, 'Equipo',
    'Tablero de tareas del equipo',
    'https://script.google.com/a/macros/camping44.com.py/s/AKfycbwFbrMH9e09811aXm1K46GDSON1sNbUdddW21P8A4cSv7AzjKq3Ly04QnILaYnQ1Iewvw/exec',
    '{
      "columnas": [
        { "clave": "puesto", "titulo": "Puesto", "alineacion": "izquierda" },
        { "clave": "situacion", "titulo": "Situación", "alineacion": "izquierda", "formato": "estado",
          "tonos": { "Pendiente": "pendiente" } },
        { "clave": "detalle", "titulo": "Detalle", "alineacion": "izquierda" }
      ],
      "filas": [
        { "puesto": "Vendedor de gimnasios", "situacion": "Pendiente", "detalle": "Búsqueda pendiente. La venta en gimnasios sigue pausada hasta la incorporación." }
      ]
    }'::jsonb
  );

  -- ---- Proyectos ---------------------------------------------------
  insert into public.secciones (informe_id, clave, titulo, etiqueta, orden)
  values (informe_vitalica, 'proyectos', 'Proyectos', '', 4)
  returning id into seccion;

  insert into public.bloques (seccion_id, tipo, orden, titulo, accion_titulo, accion_url, contenido)
  values (
    seccion, 'tabla', 1, 'Proyectos y pendientes de Dirección', '', '',
    '{
      "columnas": [
        { "clave": "tema", "titulo": "Tema", "alineacion": "izquierda" },
        { "clave": "estado", "titulo": "Estado", "alineacion": "izquierda", "formato": "estado",
          "tonos": { "Decisión": "riesgo", "En curso": "curso", "En elaboración": "pendiente", "Pausado": "pausa" } },
        { "clave": "detalle", "titulo": "Detalle", "alineacion": "izquierda" },
        { "clave": "direccion", "titulo": "Necesita de Dirección", "alineacion": "izquierda" }
      ],
      "filas": [
        { "tema": "Bolsa de entrega Vitálica y C44", "estado": "Decisión", "detalle": "Presupuesto de proveedor recibido. Diseño a definir.", "direccion": "Aprobar presupuesto" },
        { "tema": "CRM — número Vitálica", "estado": "En curso", "detalle": "En marcha con Jhamyl. Vitálica ya en trabajo.", "direccion": "—" },
        { "tema": "Reporte Olimp Q2", "estado": "En elaboración", "detalle": "Fecha de entrega propuesta pendiente de definir.", "direccion": "Validar fecha" },
        { "tema": "Vendedor de gimnasios", "estado": "Pausado", "detalle": "Venta en gimnasios detenida hasta la incorporación.", "direccion": "Estado de la búsqueda" }
      ]
    }'::jsonb
  );

end;
$$;
