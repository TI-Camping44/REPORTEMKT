-- =====================================================================
-- REPORTEMKT — Accion en el encabezado del bloque y forma de cada tipo
-- =====================================================================
--
-- Que agrega
--   Las columnas accion_titulo y accion_url en `bloques`, y la conversion del
--   contenido de los bloques de alertas al formato nuevo.
--
-- Por que
--   En el informe real casi toda tarjeta lleva un boton arriba a la derecha que
--   sale a un documento externo: "Plan de pautas (Daniela)", "Control
--   presupuestario 2026", "Tablero de tareas del equipo", "Ver informe NPS en
--   vivo". Es una propiedad del bloque, no de su contenido, y por eso va en
--   columnas y no dentro del jsonb: asi el editor la ofrece igual para los diez
--   tipos y la restriccion CHECK puede validar la direccion.
--
--   Las alertas pasan de tres niveles fijos (informacion, advertencia, critica)
--   a una etiqueta libre con un tono. El informe real usa "Aprobada", "Activa",
--   "Atencion", "Pausado", "Pendiente", "Decidir ya" y "En curso": son mas de
--   tres y cambian segun el tema. El tono decide el color; la etiqueta, el
--   texto.
--
-- =====================================================================
-- Forma del jsonb de cada tipo de bloque
-- =====================================================================
-- Esta documentacion y src/lib/bloques.ts tienen que coincidir. Si cambia una,
-- cambia la otra en el mismo commit. Un jsonb sin forma escrita en algun lado
-- es un campo libre que en seis meses nadie sabe leer.
--
-- Tonos disponibles, comunes a varios tipos:
--   "ok"        verde   — hecho, aprobado, activo
--   "curso"     azul    — en marcha
--   "pendiente" ambar   — esperando algo
--   "riesgo"    rojo    — decidir ya, bloqueado, critico
--   "pausa"     gris    — detenido a proposito
--   "neutro"    gris    — informativo
--
-- indicadores
--   { "indicadores": [ { "etiqueta": "NPS Camping 44",
--                        "valor": "93",
--                        "formato": "numero" | "guaranies" | "porcentaje" | "texto",
--                        "decimales": 0,
--                        "variacion": 12.4,      -- porcentual, puede ser null
--                        "mejorSiBaja": false,   -- true en costos
--                        "detalle": "Cierre julio" } ] }
--
-- hitos
--   { "hitos": [ { "titulo": "Isabela Olcese: contrato firmado",
--                  "detalle": "Arranca produccion de contenidos",
--                  "estado": "pendiente" | "en_curso" | "completado" | "bloqueado",
--                  "responsable": "Marketing",
--                  "fecha": "2026-08-12" } ] }
--
-- tabla
--   { "columnas": [ { "clave": "estado",
--                     "titulo": "Estado",
--                     "alineacion": "izquierda" | "centro" | "derecha",
--                     "formato": "texto" | "numero" | "guaranies" | "porcentaje" | "estado",
--                     "decimales": 0,
--                     "tonos": { "Activa": "ok", "Rechazada": "riesgo" } } ],
--     "filas": [ { "estado": "Activa" } ],
--     "total": { "campana": "Total planificado", "presupuesto": "USD 400" },
--     "nota": "Texto al pie del cuadro" }
--   El formato "estado" dibuja la celda como chip; su color sale de `tonos`.
--   `total` es opcional y se dibuja como ultima fila resaltada.
--
-- alertas
--   { "alertas": [ { "tono": "riesgo",
--                    "etiqueta": "Decidir ya",
--                    "titulo": "BIGG Coffee Run - sab 22/08",
--                    "detalle": "Fee Gs. 1.500.000 mas montaje",
--                    "enlaces": [ { "titulo": "Pauta 1", "url": "https://..." } ] } ] }
--
-- texto
--   { "texto": "Parrafos separados por una linea en blanco. No es Markdown." }
--
-- enlaces
--   { "enlaces": [ { "titulo": "Planilla de pautas",
--                    "url": "https://...",
--                    "detalle": "Actualizada al cierre" } ] }
--
-- agenda
--   { "introduccion": "Segun minuta de la reunion 23/07.",
--     "puntos": [ { "texto": "Campana Defensa No Letal - Gs. 20 M aprobados",
--                   "origen": "Minuta 23/07",
--                   "tratado": false } ] }
--   `tratado` es el estado guardado por Marketing al editar. El tildado que se
--   hace durante la reunion es solo visual y no se guarda.
--
-- linea_tiempo
--   { "pasos": [ { "fecha": "07/08",          -- texto libre: "Sept-Oct" tambien vale
--                  "titulo": "Presupuesto aprobado - Gs. 20 M",
--                  "estado": "hecho" | "actual" | "proximo" } ] }
--
-- calendario
--   { "mes": "2026-08",
--     "eventos": [ { "dia": 22, "nombre": "Bigg en el Delta", "tipo": "evento" | "activacion" } ],
--     "proximos": [ { "fecha": "26-28/09", "nombre": "MBarete CrossFit" } ] }
--   `mes` en formato AAAA-MM. `dia` es el numero del dia dentro de ese mes.
--
-- fichas
--   { "introduccion": "Toque una tarjeta para ver el detalle.",
--     "fichas": [ { "nombre": "Isabela Olcese",
--                   "rol": "Embajadora de marca",
--                   "marca": "Vitalica",
--                   "tono": "ok",
--                   "estado": "Activa",
--                   "campos": [ { "etiqueta": "Tipo de acuerdo", "valor": "Contrato firmado" } ],
--                   "materiales": [ { "titulo": "Contenido en IG", "url": "https://..." } ] } ] }
-- =====================================================================

alter table public.bloques
  add column accion_titulo text not null default '',
  add column accion_url text not null default '',
  add constraint bloques_accion_url_absoluta
    check (accion_url = '' or accion_url ~ '^https?://'),
  add constraint bloques_accion_completa
    check ((accion_titulo = '') = (accion_url = ''));

comment on column public.bloques.accion_titulo is
  'Rotulo del boton del encabezado del bloque. Vacio: el bloque no lleva boton.';
comment on constraint bloques_accion_completa on public.bloques is
  'O van las dos, o no va ninguna: un boton sin direccion no lleva a ningun lado.';

-- Conversion de los bloques de alertas al formato nuevo.
update public.bloques
set contenido = jsonb_build_object(
  'alertas',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'tono', case elemento ->> 'nivel'
                    when 'critica' then 'riesgo'
                    when 'advertencia' then 'pendiente'
                    else 'neutro'
                  end,
          'etiqueta', case elemento ->> 'nivel'
                    when 'critica' then 'Crítica'
                    when 'advertencia' then 'Atención'
                    else 'Información'
                  end,
          'titulo', elemento ->> 'titulo',
          'detalle', coalesce(elemento ->> 'detalle', '')
        )
        order by orden
      )
      from jsonb_array_elements(contenido -> 'alertas') with ordinality as t (elemento, orden)
    ),
    '[]'::jsonb
  )
)
where tipo = 'alertas'
  and jsonb_typeof(contenido -> 'alertas') = 'array';
