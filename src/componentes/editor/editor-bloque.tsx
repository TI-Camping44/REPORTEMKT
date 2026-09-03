'use client';

/**
 * Edicion de un bloque.
 *
 * El contenido se mantiene en el estado del componente y se guarda cuando la
 * persona lo pide: guardar en cada tecla generaria una escritura por caracter y
 * dejaria el informe en estados intermedios.
 */

import { useState } from 'react';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Etiquetado } from '@/componentes/campos';
import { Etiqueta } from '@/componentes/etiqueta';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import { EditorAgenda } from '@/componentes/editor/editor-agenda';
import { EditorAlertas } from '@/componentes/editor/editor-alertas';
import { EditorCalendario } from '@/componentes/editor/editor-calendario';
import { EditorEnlaces } from '@/componentes/editor/editor-enlaces';
import { EditorFichas } from '@/componentes/editor/editor-fichas';
import { EditorHitos } from '@/componentes/editor/editor-hitos';
import { EditorIndicadores } from '@/componentes/editor/editor-indicadores';
import { EditorLineaTiempo } from '@/componentes/editor/editor-linea-tiempo';
import { EditorTabla } from '@/componentes/editor/editor-tabla';
import { EditorTexto } from '@/componentes/editor/editor-texto';
import { eliminarBloque, guardarBloque, moverBloque } from '@/acciones/bloques';
import {
  DESCRIPCIONES_TIPO_BLOQUE,
  ETIQUETAS_TIPO_BLOQUE,
  type ContenidoAgenda,
  type ContenidoAlertas,
  type ContenidoBloque,
  type ContenidoCalendario,
  type ContenidoEnlaces,
  type ContenidoFichas,
  type ContenidoHitos,
  type ContenidoIndicadores,
  type ContenidoLineaTiempo,
  type ContenidoTabla,
  type ContenidoTexto,
} from '@/lib/bloques';
import type { Bloque } from '@/lib/tipos';

export function EditorBloque({
  bloque,
  esPrimero,
  esUltimo,
}: {
  bloque: Bloque;
  esPrimero: boolean;
  esUltimo: boolean;
}) {
  const [titulo, establecerTitulo] = useState(bloque.titulo);
  const [accionTitulo, establecerAccionTitulo] = useState(bloque.accion_titulo);
  const [accionUrl, establecerAccionUrl] = useState(bloque.accion_url);
  const [contenido, establecerContenido] = useState<ContenidoBloque>(bloque.contenido);
  const [sinGuardar, establecerSinGuardar] = useState(false);
  const [mensaje, establecerMensaje] = useState<string | null>(null);

  function cambiar(nuevo: ContenidoBloque) {
    establecerContenido(nuevo);
    establecerSinGuardar(true);
    establecerMensaje(null);
  }

  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo={
          <span className="flex flex-wrap items-center gap-2">
            <Etiqueta className="border-borde bg-superficie text-atenuado">
              {ETIQUETAS_TIPO_BLOQUE[bloque.tipo]}
            </Etiqueta>
            {titulo !== '' ? titulo : 'Sin título'}
            {sinGuardar ? (
              <Etiqueta className="border-advertencia/40 bg-advertencia/10 text-advertencia">
                Sin guardar
              </Etiqueta>
            ) : null}
          </span>
        }
        descripcion={DESCRIPCIONES_TIPO_BLOQUE[bloque.tipo]}
        acciones={
          <>
            <BotonAccion
              accion={() => moverBloque({ bloqueId: bloque.id, direccion: 'arriba' })}
              etiquetaCargando="Moviendo…"
              tamano="chico"
              deshabilitado={esPrimero}
            >
              Subir
            </BotonAccion>
            <BotonAccion
              accion={() => moverBloque({ bloqueId: bloque.id, direccion: 'abajo' })}
              etiquetaCargando="Moviendo…"
              tamano="chico"
              deshabilitado={esUltimo}
            >
              Bajar
            </BotonAccion>
            <BotonAccion
              accion={() => eliminarBloque({ bloqueId: bloque.id })}
              etiquetaCargando="Eliminando…"
              variante="peligro"
              tamano="chico"
              confirmacion="¿Eliminar este bloque? El contenido cargado se pierde."
            >
              Eliminar
            </BotonAccion>
          </>
        }
      />

      <CuerpoTarjeta className="space-y-4">
        <Etiquetado etiqueta="Título del bloque" ayuda="Es el encabezado que ve Dirección.">
          <CampoTexto
            value={titulo}
            placeholder={ETIQUETAS_TIPO_BLOQUE[bloque.tipo]}
            onChange={(evento) => {
              establecerTitulo(evento.target.value);
              establecerSinGuardar(true);
              establecerMensaje(null);
            }}
          />
        </Etiquetado>

        <div className="grid gap-3 sm:grid-cols-2">
          <Etiquetado
            etiqueta="Texto del botón"
            ayuda="Opcional. Aparece arriba a la derecha del bloque."
          >
            <CampoTexto
              value={accionTitulo}
              placeholder="Plan de pautas"
              onChange={(evento) => {
                establecerAccionTitulo(evento.target.value);
                establecerSinGuardar(true);
                establecerMensaje(null);
              }}
            />
          </Etiquetado>

          <Etiquetado etiqueta="Dirección del botón" ayuda="Empieza con https://">
            <CampoTexto
              value={accionUrl}
              placeholder="https://docs.google.com/..."
              onChange={(evento) => {
                establecerAccionUrl(evento.target.value);
                establecerSinGuardar(true);
                establecerMensaje(null);
              }}
            />
          </Etiquetado>
        </div>

        <FormularioSegunTipo bloque={bloque} contenido={contenido} alCambiar={cambiar} />

        {mensaje !== null ? <Aviso tono="exito">{mensaje}</Aviso> : null}

        <div className="flex items-center gap-3">
          <BotonAccion
            accion={() =>
              guardarBloque({ bloqueId: bloque.id, titulo, accionTitulo, accionUrl, contenido })
            }
            etiquetaCargando="Guardando…"
            variante="primario"
            alTerminar={(resultado) => {
              if (resultado.exito) {
                establecerSinGuardar(false);
                establecerMensaje(resultado.mensaje ?? 'Bloque guardado.');
              }
            }}
          >
            Guardar bloque
          </BotonAccion>
          {sinGuardar ? (
            <span className="text-micro text-atenuado">Hay cambios sin guardar en este bloque.</span>
          ) : null}
        </div>
      </CuerpoTarjeta>
    </Tarjeta>
  );
}

/**
 * El contenido llega como jsonb, asi que TypeScript no puede deducir su forma
 * desde `tipo`: la afirmacion de tipo es inevitable. La forma esta documentada
 * en src/lib/bloques.ts.
 */
function FormularioSegunTipo({
  bloque,
  contenido,
  alCambiar,
}: {
  bloque: Bloque;
  contenido: ContenidoBloque;
  alCambiar: (contenido: ContenidoBloque) => void;
}) {
  switch (bloque.tipo) {
    case 'indicadores':
      return <EditorIndicadores contenido={contenido as ContenidoIndicadores} alCambiar={alCambiar} />;
    case 'agenda':
      return <EditorAgenda contenido={contenido as ContenidoAgenda} alCambiar={alCambiar} />;
    case 'linea_tiempo':
      return <EditorLineaTiempo contenido={contenido as ContenidoLineaTiempo} alCambiar={alCambiar} />;
    case 'calendario':
      return <EditorCalendario contenido={contenido as ContenidoCalendario} alCambiar={alCambiar} />;
    case 'fichas':
      return <EditorFichas contenido={contenido as ContenidoFichas} alCambiar={alCambiar} />;
    case 'hitos':
      return <EditorHitos contenido={contenido as ContenidoHitos} alCambiar={alCambiar} />;
    case 'tabla':
      return <EditorTabla contenido={contenido as ContenidoTabla} alCambiar={alCambiar} />;
    case 'alertas':
      return <EditorAlertas contenido={contenido as ContenidoAlertas} alCambiar={alCambiar} />;
    case 'texto':
      return <EditorTexto contenido={contenido as ContenidoTexto} alCambiar={alCambiar} />;
    case 'enlaces':
      return <EditorEnlaces contenido={contenido as ContenidoEnlaces} alCambiar={alCambiar} />;
    default:
      return <p className="text-xs text-atenuado">Tipo de bloque no reconocido.</p>;
  }
}
