import Link from 'next/link';

import { ListaBloques } from '@/componentes/bloques/lista-bloques';
import { EtiquetaEstadoInforme } from '@/componentes/etiqueta';
import { EnlaceBoton } from '@/componentes/boton';
import { EstadoVacio } from '@/componentes/tarjeta';
import { ListaEnlaces } from '@/componentes/lista-enlaces';
import { PestanasSecciones } from '@/componentes/pestanas-secciones';
import { SelectorPeriodo } from '@/componentes/selector-periodo';
import { TableroLooker } from '@/componentes/tablero-looker';
import { formatearFecha, formatearFechaHora } from '@/lib/formato';
import { rotularPeriodo } from '@/lib/periodos';
import type { Informe, InformeCompleto } from '@/lib/tipos';

/** Rotulo del periodo: el que escribio Marketing, o el calculado si esta vacio. */
function rotuloDelPeriodo(informe: Informe): string {
  if (informe.periodo_etiqueta !== '') return informe.periodo_etiqueta;
  return rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio);
}

export function VistaInforme({
  informe,
  informesDeLaEmpresa,
  puedeEditar,
  creadoPor,
}: {
  informe: InformeCompleto;
  informesDeLaEmpresa: Informe[];
  puedeEditar: boolean;
  creadoPor: string | null;
}) {
  const empresa = informe.empresa;
  const slug = empresa?.slug ?? '';
  const conContenido = informe.secciones.some((seccion) => seccion.bloques.length > 0);

  return (
    <div className="mx-auto max-w-contenido px-4 pb-16">
      <header className="pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              {empresa !== null ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-atenuado">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: empresa.color }}
                  />
                  {empresa.nombre}
                </span>
              ) : null}
              <EtiquetaEstadoInforme estado={informe.estado} />
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-texto">{informe.titulo}</h1>

            <p className="mt-1 text-xs leading-relaxed text-atenuado">
              Período: {rotuloDelPeriodo(informe)}
              {informe.reunion_fecha !== '' ? (
                <> · Reunión Marketing-GG {formatearFecha(informe.reunion_fecha)}</>
              ) : null}
              {informe.reunion_hora !== '' ? <>, {informe.reunion_hora}</> : null}
              {informe.presenta !== '' ? <> · Presenta: {informe.presenta}</> : null}
            </p>
            <p className="mt-0.5 text-micro text-atenuado">
              Actualizado el {formatearFechaHora(informe.actualizado_en)}
              {creadoPor !== null ? <> · Creado por {creadoPor}</> : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <SelectorPeriodo empresaSlug={slug} informes={informesDeLaEmpresa} informeActualId={informe.id} />
            {puedeEditar ? (
              <EnlaceBoton href={`/${slug}/${informe.id}/editar`} variante="secundario" tamano="chico">
                Editar
              </EnlaceBoton>
            ) : null}
          </div>
        </div>
      </header>

      <PestanasSecciones
        secciones={informe.secciones.map((seccion) => ({ clave: seccion.clave, titulo: seccion.titulo }))}
      />

      {!conContenido ? (
        <div className="mt-6">
          <EstadoVacio
            titulo="Este informe todavía no tiene contenido"
            detalle={
              puedeEditar
                ? 'Agregue bloques desde la pantalla de edición, o duplique el informe de la reunión anterior para no empezar de cero.'
                : 'Marketing todavía no cargó el contenido de este período.'
            }
            accion={
              puedeEditar ? (
                <EnlaceBoton href={`/${slug}/${informe.id}/editar`} variante="primario">
                  Cargar contenido
                </EnlaceBoton>
              ) : undefined
            }
          />
        </div>
      ) : null}

      {informe.secciones.map((seccion) => (
        <section key={seccion.id} id={seccion.clave} className="scroll-mt-28 pt-6">
          <h2 className="mb-2 flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-texto">{seccion.titulo}</span>
            {seccion.etiqueta !== '' ? (
              <span className="text-xs text-atenuado">{seccion.etiqueta}</span>
            ) : null}
          </h2>
          {seccion.bloques.length === 0 ? (
            <p className="text-xs text-atenuado">Esta sección todavía no tiene bloques.</p>
          ) : (
            <ListaBloques bloques={seccion.bloques} puedeEditar={puedeEditar} />
          )}
        </section>
      ))}

      {informe.tableros.length > 0 ? (
        <section className="pt-8">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-texto">Tableros</h2>
          <div className="space-y-3">
            {informe.tableros.map((tablero) => (
              <TableroLooker key={tablero.id} tablero={tablero} />
            ))}
          </div>
        </section>
      ) : null}

      {informe.enlaces.length > 0 ? (
        <section className="pt-8">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-texto">Enlaces útiles</h2>
          <ListaEnlaces enlaces={informe.enlaces} />
        </section>
      ) : null}

      <footer className="mt-10 border-t border-borde pt-4 text-micro text-atenuado">
        <Link href={`/${slug}/historial`} className="hover:text-texto">
          Ver informes anteriores de {empresa?.nombre ?? 'la empresa'}
        </Link>
      </footer>
    </div>
  );
}
