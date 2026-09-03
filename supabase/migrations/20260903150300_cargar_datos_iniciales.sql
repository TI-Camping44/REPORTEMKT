-- =====================================================================
-- REPORTEMKT — Datos iniciales
-- =====================================================================
--
-- Que agrega
--   Las dos empresas, un tablero de Looker por empresa con la direccion de
--   insercion todavia vacia, y un informe de ejemplo publicado para Camping 44
--   con un bloque de cada tipo salvo enlaces.
--
-- Por que
--   Las empresas no son un catalogo que se edite desde la interfaz: son dos y
--   se cargan aca. El informe de ejemplo existe para que la aplicacion se pueda
--   revisar sin cargar nada a mano y para que quede a la vista como se ve cada
--   tipo de bloque. Se puede borrar desde la pantalla de edicion.
--
--   Los tableros nacen con url_insercion vacia porque los informes de Looker
--   todavia no estan hechos. La vista muestra un recuadro de pendiente en lugar
--   de un iframe roto.
--
--   No se cargan enlaces: las direcciones de la planilla de pautas, del control
--   presupuestario y del informe de NPS no se inventan. Las carga TI desde la
--   pantalla de administracion.
-- =====================================================================

insert into public.empresas (slug, nombre, color, orden) values
  ('camping44', 'Camping 44', '#E01E37', 1),
  ('vitalica',  'Vitálica',   '#1F7A5C', 2);

insert into public.tableros (empresa_id, nombre, url_insercion, alto_px, orden, activo)
select id, 'Tablero de Marketing — Camping 44', '', 1200, 1, true
from public.empresas where slug = 'camping44';

insert into public.tableros (empresa_id, nombre, url_insercion, alto_px, orden, activo)
select id, 'Tablero de Marketing — Vitálica', '', 1200, 1, true
from public.empresas where slug = 'vitalica';

-- ---------------------------------------------------------------------
-- Informe de ejemplo: Camping 44, agosto de 2026, publicado
-- ---------------------------------------------------------------------

with informe_de_ejemplo as (
  insert into public.informes (
    empresa_id,
    periodo_tipo,
    periodo_inicio,
    periodo_fin,
    estado,
    creado_por
  )
  select
    id,
    'mensual'::public.periodo_informe,
    date '2026-08-01',
    date '2026-08-31',
    'publicado'::public.estado_informe,
    null
  from public.empresas
  where slug = 'camping44'
  returning id
)
insert into public.bloques (informe_id, tipo, orden, titulo, contenido)
select
  informe_de_ejemplo.id,
  contenidos.tipo::public.tipo_bloque,
  contenidos.orden,
  contenidos.titulo,
  contenidos.contenido::jsonb
from informe_de_ejemplo,
  (values
    (
      'indicadores',
      1,
      'Resumen del periodo',
      '{
        "indicadores": [
          { "etiqueta": "Sesiones en el sitio", "valor": "18432", "formato": "numero", "variacion": 12.4, "detalle": "vs. julio" },
          { "etiqueta": "Consultas por formulario", "valor": "241", "formato": "numero", "variacion": -6.1, "detalle": "vs. julio" },
          { "etiqueta": "Inversión publicitaria", "valor": "24650000", "formato": "guaranies", "variacion": 8.0, "detalle": "Meta y Google" },
          { "etiqueta": "Costo por consulta", "valor": "102282", "formato": "guaranies", "variacion": 15.0, "mejorSiBaja": true, "detalle": "Inversión sobre consultas" },
          { "etiqueta": "Seguidores nuevos", "valor": "1877", "formato": "numero", "variacion": 3.2, "detalle": "Instagram y Facebook" }
        ]
      }'
    ),
    (
      'hitos',
      2,
      'Campañas y proyectos',
      '{
        "hitos": [
          { "titulo": "Campaña Día del Niño", "detalle": "Cerrada con la agencia. Piezas entregadas y publicadas en fecha.", "estado": "completado", "responsable": "Agencia", "fecha": "2026-08-16" },
          { "titulo": "Renovación del catálogo de camping", "detalle": "Fotografía de producto terminada, falta la maquetación.", "estado": "en_curso", "responsable": "Marketing", "fecha": "2026-09-15" },
          { "titulo": "Acuerdo con influencer de pesca deportiva", "detalle": "Propuesta enviada, esperando respuesta.", "estado": "pendiente", "responsable": "Marketing", "fecha": "2026-09-05" },
          { "titulo": "Renovación del sitio web", "detalle": "Frenado hasta que se defina el presupuesto anual.", "estado": "bloqueado", "responsable": "Dirección", "fecha": null }
        ]
      }'
    ),
    (
      'alertas',
      3,
      'Decisiones pendientes de Dirección',
      '{
        "alertas": [
          { "nivel": "critica", "titulo": "Presupuesto de pauta de septiembre sin aprobar", "detalle": "Sin la aprobación no se puede reservar la pauta de la temporada alta. Pendiente desde el 12/08." },
          { "nivel": "advertencia", "titulo": "Contrato con la agencia vence el 30/09", "detalle": "Hay que decidir si se renueva o se llama a otra propuesta." },
          { "nivel": "informacion", "titulo": "Vacaciones de la diseñadora en la segunda quincena de septiembre", "detalle": "Las piezas de esa quincena se adelantan." }
        ]
      }'
    ),
    (
      'tabla',
      4,
      'Inversión publicitaria por medio',
      '{
        "columnas": [
          { "clave": "medio", "titulo": "Medio", "alineacion": "izquierda" },
          { "clave": "inversion", "titulo": "Inversión", "alineacion": "derecha", "formato": "guaranies" },
          { "clave": "participacion", "titulo": "Participación", "alineacion": "derecha", "formato": "porcentaje", "decimales": 1 },
          { "clave": "consultas", "titulo": "Consultas", "alineacion": "derecha", "formato": "numero" }
        ],
        "filas": [
          { "medio": "Meta Ads", "inversion": 12400000, "participacion": 50.3, "consultas": 138 },
          { "medio": "Google Ads", "inversion": 8750000, "participacion": 35.5, "consultas": 79 },
          { "medio": "Radio", "inversion": 2500000, "participacion": 10.1, "consultas": 15 },
          { "medio": "Vía pública", "inversion": 1000000, "participacion": 4.1, "consultas": 9 }
        ],
        "nota": "Los montos salen del control presupuestario; el detalle de rendimiento está en el tablero de Looker."
      }'
    ),
    (
      'texto',
      5,
      'Situación del equipo',
      '{
        "texto": "El equipo trabajó el mes completo sin ausencias. La carga estuvo concentrada en la campaña del Día del Niño, que ocupó las dos primeras semanas.\n\nQueda pendiente definir si se contrata apoyo externo para la producción audiovisual de la temporada alta. La estimación de la agencia llega la primera semana de septiembre."
      }'
    )
  ) as contenidos (tipo, orden, titulo, contenido);
