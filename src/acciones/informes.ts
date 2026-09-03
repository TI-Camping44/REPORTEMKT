'use server';

/**
 * Escrituras sobre informes.
 *
 * Este archivo solo exporta funciones asincronas, que es lo unico que admite un
 * modulo "use server". Las constantes y las reglas sincronas viven en src/lib/.
 *
 * Todas validan antes de escribir. La base tiene ademas sus restricciones
 * CHECK: la validacion de aca es la que explica el problema en espanol, la de
 * la base es la que garantiza que no entre un dato invalido por otra via.
 */

import { revalidatePath } from 'next/cache';

import { TIPOS_PERIODO, type TipoPeriodo } from '@/lib/constantes';
import { mensajeDeError } from '@/lib/errores';
import { calcularPeriodo, esFechaValida } from '@/lib/periodos';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { Bloque, Informe, ResultadoAccion } from '@/lib/tipos';

export async function crearInforme(datos: {
  empresaId: string;
  empresaSlug: string;
  periodoTipo: string;
  periodoInicio: string;
  duplicarDe?: string | null;
}): Promise<ResultadoAccion> {
  const sesion = await requerirEditor();

  if (!(TIPOS_PERIODO as readonly string[]).includes(datos.periodoTipo)) {
    return { exito: false, error: 'Elija si el informe es quincenal o mensual.' };
  }

  if (!esFechaValida(datos.periodoInicio)) {
    return { exito: false, error: 'Elija un período válido.' };
  }

  const periodo = calcularPeriodo(datos.periodoTipo as TipoPeriodo, datos.periodoInicio);
  const supabase = crearClienteDeServidor();

  const { data: informeNuevo, error } = await supabase
    .from('informes')
    .insert({
      empresa_id: datos.empresaId,
      periodo_tipo: periodo.tipo,
      periodo_inicio: periodo.inicio,
      periodo_fin: periodo.fin,
      estado: 'borrador',
      creado_por: sesion.usuario.id,
    })
    .select('id')
    .single();

  if (error !== null || informeNuevo === null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo crear el informe.') };
  }

  const identificador = (informeNuevo as { id: string }).id;

  // Duplicar el informe anterior es lo que hace sostenible la carga: entre una
  // quincena y la siguiente cambia una parte del contenido, no todo.
  if (datos.duplicarDe !== undefined && datos.duplicarDe !== null && datos.duplicarDe !== '') {
    const { data: bloquesOrigen, error: errorLectura } = await supabase
      .from('bloques')
      .select('tipo, orden, titulo, contenido')
      .eq('informe_id', datos.duplicarDe)
      .order('orden', { ascending: true });

    if (errorLectura !== null) {
      return {
        exito: true,
        id: identificador,
        mensaje: 'Se creó el informe, pero no se pudieron copiar los bloques del informe anterior.',
      };
    }

    const bloques = (bloquesOrigen as Array<Pick<Bloque, 'tipo' | 'orden' | 'titulo' | 'contenido'>> | null) ?? [];

    if (bloques.length > 0) {
      const { error: errorCopia } = await supabase.from('bloques').insert(
        bloques.map((bloque) => ({
          informe_id: identificador,
          tipo: bloque.tipo,
          orden: bloque.orden,
          titulo: bloque.titulo,
          contenido: bloque.contenido,
        })),
      );

      if (errorCopia !== null) {
        return {
          exito: true,
          id: identificador,
          mensaje: 'Se creó el informe, pero no se pudieron copiar los bloques del informe anterior.',
        };
      }
    }
  }

  revalidatePath(`/${datos.empresaSlug}`);
  revalidatePath(`/${datos.empresaSlug}/historial`);

  return { exito: true, id: identificador, mensaje: 'Informe creado.' };
}

async function cambiarEstado(
  informeId: string,
  estado: 'borrador' | 'publicado',
): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: informe } = await supabase
    .from('informes')
    .select('id, empresa_id, estado')
    .eq('id', informeId)
    .maybeSingle();

  if (informe === null) {
    return { exito: false, error: 'No se encontró el informe. Puede haber sido eliminado.' };
  }

  if (estado === 'publicado') {
    const { count } = await supabase
      .from('bloques')
      .select('id', { count: 'exact', head: true })
      .eq('informe_id', informeId);

    if ((count ?? 0) === 0) {
      return {
        exito: false,
        error: 'El informe no tiene ningún bloque cargado. Agregue contenido antes de publicarlo.',
      };
    }
  }

  const { error } = await supabase.from('informes').update({ estado }).eq('id', informeId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo cambiar el estado del informe.') };
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('slug')
    .eq('id', (informe as Informe).empresa_id)
    .maybeSingle();

  const slug = (empresa as { slug: string } | null)?.slug;
  if (slug !== undefined) {
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/historial`);
  }
  revalidatePath(`/${slug ?? ''}/${informeId}`);

  return {
    exito: true,
    mensaje: estado === 'publicado' ? 'Informe publicado.' : 'El informe volvió a borrador.',
  };
}

export async function publicarInforme(informeId: string): Promise<ResultadoAccion> {
  return cambiarEstado(informeId, 'publicado');
}

export async function volverInformeABorrador(informeId: string): Promise<ResultadoAccion> {
  return cambiarEstado(informeId, 'borrador');
}

export async function eliminarInforme(informeId: string): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: informe } = await supabase
    .from('informes')
    .select('id, empresa_id, estado')
    .eq('id', informeId)
    .maybeSingle();

  if (informe === null) {
    return { exito: false, error: 'No se encontró el informe. Puede haber sido eliminado.' };
  }

  if ((informe as Informe).estado === 'publicado') {
    return {
      exito: false,
      error:
        'Un informe publicado es la foto de su período y no se elimina. Si hay que corregirlo, primero devuélvalo a borrador.',
    };
  }

  const { error } = await supabase.from('informes').delete().eq('id', informeId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo eliminar el informe.') };
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('slug')
    .eq('id', (informe as Informe).empresa_id)
    .maybeSingle();

  const slug = (empresa as { slug: string } | null)?.slug;
  if (slug !== undefined) {
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/historial`);
  }

  return { exito: true, mensaje: 'Informe eliminado.' };
}
