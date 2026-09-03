import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EstadoVacio, Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/componentes/tarjeta';
import { ListaDecisiones } from '@/componentes/seguimiento/lista-decisiones';
import { TablaSeguimiento } from '@/componentes/seguimiento/tabla-seguimiento';
import { listarInformesDeEmpresa, obtenerBloquesPorInforme, obtenerEmpresaPorSlug } from '@/lib/datos';
import { armarSeguimiento } from '@/lib/seguimiento';
import { puedeEditar } from '@/lib/permisos';
import { requerirUsuario } from '@/lib/sesion';
import { clases } from '@/lib/utilidades';

export const metadata: Metadata = { title: 'Seguimiento' };

/** Cuantas reuniones se muestran. `0` significa todas. */
const OPCIONES_DE_ALCANCE = [
  { valor: '3', etiqueta: 'Últimas 3' },
  { valor: '6', etiqueta: 'Últimas 6' },
  { valor: '12', etiqueta: 'Últimas 12' },
  { valor: 'todas', etiqueta: 'Todas' },
] as const;

function cantidadDeReuniones(parametro: string | undefined): number {
  if (parametro === 'todas') return 0;
  const numero = Number(parametro);
  return Number.isInteger(numero) && numero > 0 ? numero : 6;
}

/**
 * Evolucion entre reuniones.
 *
 * No calcula metricas ni consulta ninguna API: recorre los informes ya cargados
 * y ordena lo que ya esta escrito en ellos. El panel de trafico, redes y pauta
 * es Looker, y va embebido en cada informe.
 */
export default async function PaginaDeSeguimiento({
  params,
  searchParams,
}: {
  params: { empresa: string };
  searchParams: { reuniones?: string };
}) {
  const { usuario } = await requerirUsuario();
  const empresa = await obtenerEmpresaPorSlug(params.empresa);

  if (empresa === null) notFound();

  const todos = await listarInformesDeEmpresa(empresa.id);
  const visibles = puedeEditar(usuario.rol)
    ? todos
    : todos.filter((informe) => informe.estado === 'publicado');

  const cantidad = cantidadDeReuniones(searchParams.reuniones);
  const alcance = searchParams.reuniones === 'todas' ? 'todas' : String(cantidad);
  // `visibles` viene de la mas nueva a la mas vieja: se recortan las primeras.
  const informes = cantidad === 0 ? visibles : visibles.slice(0, cantidad);

  const bloques = await obtenerBloquesPorInforme(informes.map((informe) => informe.id));
  const seguimiento = armarSeguimiento(informes, bloques);

  return (
    <div className="mx-auto max-w-contenido space-y-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Seguimiento</h1>
          <p className="mt-0.5 max-w-prose text-xs leading-relaxed text-atenuado">
            {empresa.nombre} · Cómo evolucionó cada indicador de una reunión a la siguiente, y qué
            decisiones siguen esperando a Dirección. Los informes no se modifican: esta pantalla solo
            los ordena.
          </p>
        </div>

        <nav aria-label="Cantidad de reuniones" className="flex flex-wrap items-center gap-1">
          {OPCIONES_DE_ALCANCE.map((opcion) => (
            <Link
              key={opcion.valor}
              href={`/${empresa.slug}/seguimiento?reuniones=${opcion.valor}`}
              aria-current={alcance === opcion.valor ? 'page' : undefined}
              className={clases(
                'rounded-md px-2.5 py-1 text-xs transition-colors',
                alcance === opcion.valor
                  ? 'bg-superficie font-medium text-texto'
                  : 'text-atenuado hover:text-texto',
              )}
            >
              {opcion.etiqueta}
            </Link>
          ))}
        </nav>
      </header>

      {seguimiento.reuniones.length < 2 ? (
        <EstadoVacio
          titulo="Hace falta más de una reunión para comparar"
          detalle={
            seguimiento.reuniones.length === 0
              ? 'Todavía no hay informes cargados de esta empresa.'
              : 'Hay un solo informe. Cuando se cargue el de la próxima reunión, acá va a aparecer la evolución de cada indicador.'
          }
        />
      ) : (
        <>
          <Tarjeta>
            <CabeceraTarjeta
              titulo="Indicadores por reunión"
              descripcion="La variación compara las dos últimas reuniones en que aparece cada indicador."
            />
            <CuerpoTarjeta>
              {seguimiento.indicadores.length === 0 ? (
                <p className="text-xs text-atenuado">
                  Ninguno de estos informes tiene bloques de indicadores cargados.
                </p>
              ) : (
                <TablaSeguimiento
                  reuniones={seguimiento.reuniones}
                  indicadores={seguimiento.indicadores}
                />
              )}
            </CuerpoTarjeta>
          </Tarjeta>

          <Tarjeta>
            <CabeceraTarjeta
              titulo="Decisiones pendientes"
              descripcion="Los puntos marcados como críticos o pendientes, con cuántas reuniones llevan. Los que ya no aparecen en la última reunión se muestran atenuados."
            />
            <CuerpoTarjeta>
              <ListaDecisiones decisiones={seguimiento.decisiones} />
            </CuerpoTarjeta>
          </Tarjeta>

          <p className="text-micro leading-relaxed text-atenuado">
            Los indicadores se siguen por su etiqueta. Si se renombra un indicador de una reunión a
            la otra, la serie se corta y aparece como dos indicadores distintos.
          </p>
        </>
      )}
    </div>
  );
}
