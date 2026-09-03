-- =====================================================================
-- REPORTEMKT — Tipos de bloque nuevos
-- =====================================================================
--
-- Que agrega
--   Cuatro valores al enumerado tipo_bloque: agenda, linea_tiempo, calendario
--   y fichas.
--
-- Por que
--   El informe que Marketing presenta usa cuatro formas que los seis tipos
--   originales no cubren:
--
--     agenda        Los temas a tratar en la reunion, con el origen de cada uno
--                   (minuta, pedido de Direccion, informativo). Se tildan en
--                   pantalla durante la reunion.
--     linea_tiempo  El avance de una campana en pasos con fecha, cada uno
--                   hecho, actual o proximo.
--     calendario    La grilla mensual de eventos y activaciones, con su leyenda
--                   y la lista de proximos.
--     fichas        Las tarjetas de influencers, con detalle desplegable.
--
--   La forma del jsonb de cada uno esta en el encabezado de la migracion
--   siguiente y en src/lib/bloques.ts.
--
-- Esta migracion solo agrega valores al enumerado y no los usa. Es a proposito:
-- PostgreSQL no permite usar un valor de enumerado agregado en la misma
-- transaccion en que se lo declara.
-- =====================================================================

alter type public.tipo_bloque add value if not exists 'agenda';
alter type public.tipo_bloque add value if not exists 'linea_tiempo';
alter type public.tipo_bloque add value if not exists 'calendario';
alter type public.tipo_bloque add value if not exists 'fichas';
