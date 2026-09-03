'use server';

/** Escrituras sobre los bloques de un informe. */

import { revalidatePath } from 'next/cache';

import { contenidoPorDefecto, esTipoBloque, validarContenidoBloque } from '@/lib/bloques';
import { mensajeDeError } from '@/lib/errores';
import { requerirEditor } from '@/lib/sesion';
import { crearClienteDeServidor } from '@/lib/supabase/servidor';
import type { Bloque, ResultadoAccion } from '@/lib/tipos';

/** Vuelve a pedir al servidor la pantalla de edicion y la de lectura del informe. */
async function revalidarInforme(informeId: string): Promise<void> {
  const supabase = crearClienteDeServidor();
  const { data } = await supabase
    .from('informes')
    .select('empresa_id, empresas ( slug )')
    .eq('id', informeId)
    .maybeSingle();

  const slug = (data as { empresas: { slug: string } | null } | null)?.empresas?.slug;
  if (slug === undefined) return;

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/${informeId}`);
  revalidatePath(`/${slug}/${informeId}/editar`);
}

export async function agregarBloque(datos: {
  informeId: string;
  tipo: string;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  if (!esTipoBloque(datos.tipo)) {
    return { exito: false, error: 'Elija un tipo de bloque válido.' };
  }

  const supabase = crearClienteDeServidor();

  const { data: ultimo } = await supabase
    .from('bloques')
    .select('orden')
    .eq('informe_id', datos.informeId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ordenNuevo = ((ultimo as { orden: number } | null)?.orden ?? 0) + 1;

  const { data: creado, error } = await supabase
    .from('bloques')
    .insert({
      informe_id: datos.informeId,
      tipo: datos.tipo,
      orden: ordenNuevo,
      titulo: '',
      contenido: contenidoPorDefecto(datos.tipo),
    })
    .select('id')
    .single();

  if (error !== null || creado === null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo agregar el bloque.') };
  }

  await revalidarInforme(datos.informeId);

  return { exito: true, id: (creado as { id: string }).id, mensaje: 'Bloque agregado.' };
}

export async function guardarBloque(datos: {
  bloqueId: string;
  titulo: string;
  contenido: unknown;
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: bloque } = await supabase
    .from('bloques')
    .select('id, informe_id, tipo')
    .eq('id', datos.bloqueId)
    .maybeSingle();

  if (bloque === null) {
    return { exito: false, error: 'No se encontró el bloque. Recargue la pantalla.' };
  }

  const tipo = (bloque as Pick<Bloque, 'tipo' | 'informe_id'>).tipo;
  const problema = validarContenidoBloque(tipo, datos.contenido);

  if (problema !== null) {
    return { exito: false, error: problema };
  }

  const titulo = datos.titulo.trim();
  if (titulo.length > 200) {
    return { exito: false, error: 'El título del bloque no puede superar los 200 caracteres.' };
  }

  const { error } = await supabase
    .from('bloques')
    .update({ titulo, contenido: datos.contenido })
    .eq('id', datos.bloqueId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo guardar el bloque.') };
  }

  await revalidarInforme((bloque as Pick<Bloque, 'informe_id'>).informe_id);

  return { exito: true, mensaje: 'Bloque guardado.' };
}

export async function eliminarBloque(bloqueId: string): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: bloque } = await supabase
    .from('bloques')
    .select('informe_id')
    .eq('id', bloqueId)
    .maybeSingle();

  if (bloque === null) {
    return { exito: false, error: 'No se encontró el bloque. Recargue la pantalla.' };
  }

  const { error } = await supabase.from('bloques').delete().eq('id', bloqueId);

  if (error !== null) {
    return { exito: false, error: mensajeDeError(error, 'No se pudo eliminar el bloque.') };
  }

  await revalidarInforme((bloque as Pick<Bloque, 'informe_id'>).informe_id);

  return { exito: true, mensaje: 'Bloque eliminado.' };
}

/**
 * Mueve un bloque una posicion.
 *
 * Se intercambian los valores de `orden` con el bloque vecino. No hay
 * restriccion de unicidad sobre `orden`, asi que el intercambio no necesita un
 * valor intermedio.
 */
export async function moverBloque(datos: {
  bloqueId: string;
  direccion: 'arriba' | 'abajo';
}): Promise<ResultadoAccion> {
  await requerirEditor();

  const supabase = crearClienteDeServidor();

  const { data: bloque } = await supabase
    .from('bloques')
    .select('id, informe_id, orden')
    .eq('id', datos.bloqueId)
    .maybeSingle();

  if (bloque === null) {
    return { exito: false, error: 'No se encontró el bloque. Recargue la pantalla.' };
  }

  const actual = bloque as Pick<Bloque, 'id' | 'informe_id' | 'orden'>;

  const { data: hermanos } = await supabase
    .from('bloques')
    .select('id, orden')
    .eq('informe_id', actual.informe_id)
    .order('orden', { ascending: true })
    .order('id', { ascending: true });

  const lista = (hermanos as Array<{ id: string; orden: number }> | null) ?? [];
  const posicion = lista.findIndex((elemento) => elemento.id === actual.id);

  if (posicion === -1) {
    return { exito: false, error: 'No se encontró el bloque. Recargue la pantalla.' };
  }

  const posicionVecina = datos.direccion === 'arriba' ? posicion - 1 : posicion + 1;

  if (lista[posicionVecina] === undefined) {
    return { exito: false, error: 'El bloque ya está en el extremo de la lista.' };
  }

  // Se intercambian las dos posiciones y se vuelve a numerar la lista entera.
  // Intercambiar solo los dos valores de `orden` no alcanza: pueden venir
  // repetidos o con huecos de duplicaciones anteriores, y el resultado seria un
  // orden distinto del que la persona ve en pantalla.
  const reordenada = [...lista];
  const propio = reordenada[posicion];
  const vecino = reordenada[posicionVecina];

  if (propio === undefined || vecino === undefined) {
    return { exito: false, error: 'No se encontró el bloque. Recargue la pantalla.' };
  }

  reordenada[posicion] = vecino;
  reordenada[posicionVecina] = propio;

  for (const [indice, elemento] of reordenada.entries()) {
    if (elemento.orden === indice + 1) continue;

    const { error } = await supabase
      .from('bloques')
      .update({ orden: indice + 1 })
      .eq('id', elemento.id);

    if (error !== null) {
      return { exito: false, error: mensajeDeError(error, 'No se pudo reordenar el bloque.') };
    }
  }

  await revalidarInforme(actual.informe_id);

  return { exito: true };
}
