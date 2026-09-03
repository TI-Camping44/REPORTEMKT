/**
 * Refresco diario de los bloques vinculados a una planilla.
 *
 * Lo dispara la tarea programada de Vercel declarada en vercel.json. Corre sin
 * sesion de nadie, asi que usa el cliente con la clave de servicio: es
 * exactamente el caso para el que existe, un proceso de mantenimiento sin
 * persona detras.
 *
 * Solo toca informes en borrador. Un informe publicado es el registro de lo que
 * se presento en esa reunion y no se reescribe solo.
 */

import { NextResponse, type NextRequest } from 'next/server';

import { validarContenidoBloque, type TipoBloque } from '@/lib/bloques';
import { convertirDesdePlanilla } from '@/lib/desde-planilla';
import { ErrorDePlanilla, leerRango } from '@/lib/planillas';
import { crearClienteAdministrador } from '@/lib/supabase/administrador';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type BloqueVinculado = {
  id: string;
  tipo: TipoBloque;
  contenido: unknown;
  fuente_planilla_id: string;
  fuente_rango: string;
  secciones: unknown;
};

/**
 * Estado del informe al que pertenece el bloque.
 *
 * PostgREST devuelve la relacion anidada como objeto, pero el cliente sin tipos
 * generados no lo sabe y a veces la infiere como arreglo. Se contemplan las dos
 * formas para no depender de esa inferencia.
 */
function estadoDelInforme(secciones: unknown): string | null {
  const seccion = Array.isArray(secciones) ? secciones[0] : secciones;
  if (typeof seccion !== 'object' || seccion === null) return null;

  const informes = (seccion as { informes?: unknown }).informes;
  const informe = Array.isArray(informes) ? informes[0] : informes;
  if (typeof informe !== 'object' || informe === null) return null;

  const estado = (informe as { estado?: unknown }).estado;
  return typeof estado === 'string' ? estado : null;
}

function autorizada(peticion: NextRequest): boolean {
  const esperado = process.env.CRON_SECRET;

  // Sin secreto configurado no se corre: es preferible que la tarea no haga
  // nada a que quede una direccion que cualquiera pueda disparar.
  if (esperado === undefined || esperado.trim() === '') return false;

  return peticion.headers.get('authorization') === `Bearer ${esperado}`;
}

export async function GET(peticion: NextRequest) {
  if (!autorizada(peticion)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const supabase = crearClienteAdministrador();

  const { data, error } = await supabase
    .from('bloques')
    .select('id, tipo, contenido, fuente_planilla_id, fuente_rango, secciones ( informes ( estado ) )')
    .eq('fuente', 'planilla');

  if (error !== null) {
    return NextResponse.json({ error: 'No se pudieron listar los bloques.' }, { status: 500 });
  }

  const vinculados = ((data as unknown as BloqueVinculado[] | null) ?? []).filter(
    (bloque) => estadoDelInforme(bloque.secciones) === 'borrador',
  );

  let actualizados = 0;
  let fallidos = 0;

  for (const bloque of vinculados) {
    let problema: string | null = null;

    try {
      const filas = await leerRango(bloque.fuente_planilla_id, bloque.fuente_rango);
      const conversion = convertirDesdePlanilla(bloque.tipo, filas, bloque.contenido);

      if (!conversion.exito) {
        problema = conversion.error;
      } else {
        problema = validarContenidoBloque(bloque.tipo, conversion.contenido);

        if (problema === null) {
          await supabase
            .from('bloques')
            .update({
              contenido: conversion.contenido,
              fuente_actualizada_en: new Date().toISOString(),
              fuente_error: '',
            })
            .eq('id', bloque.id);
        }
      }
    } catch (error) {
      problema =
        error instanceof ErrorDePlanilla
          ? error.message
          : 'No se pudo contactar con Google para leer la planilla.';
    }

    if (problema === null) {
      actualizados += 1;
    } else {
      fallidos += 1;
      await supabase.from('bloques').update({ fuente_error: problema }).eq('id', bloque.id);
    }
  }

  return NextResponse.json({
    revisados: vinculados.length,
    actualizados,
    fallidos,
  });
}
