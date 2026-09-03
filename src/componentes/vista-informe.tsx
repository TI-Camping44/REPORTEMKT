import { EnlaceBoton } from '@/componentes/boton';
import { ListaBloques } from '@/componentes/bloques/lista-bloques';
import { EtiquetaEstadoInforme } from '@/componentes/etiqueta';
import { ListaEnlaces } from '@/componentes/lista-enlaces';
import { SelectorPeriodo } from '@/componentes/selector-periodo';
import { TableroLooker } from '@/componentes/tablero-looker';
import { EstadoVacio } from '@/componentes/tarjeta';
import { ETIQUETAS_TIPO_PERIODO } from '@/lib/constantes';
import { formatearFecha, formatearFechaHora } from '@/lib/formato';
import { rotularPeriodo, rotularRango } from '@/lib/periodos';
import { puedeEditar } from '@/lib/permisos';
import type { Bloque, Empresa, Enlace, Informe, Tablero, Usuario } from '@/lib/tipos';

export function VistaInforme({
  empresa,
  informe,
  informes,
  bloques,
  tableros,
  enlaces,
  usuario,
  nombreDeQuienCreo,
}: {
  empresa: Empresa;
  informe: Informe;
  informes: Informe[];
  bloques: Bloque[];
  tableros: Tablero[];
  enlaces: Enlace[];
  usuario: Usuario;
  nombreDeQuienCreo: string | null;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: empresa.color }}
            />
            <span className="text-xs font-medium uppercase tracking-wide text-atenuado">
              {empresa.nombre}
            </span>
            <EtiquetaEstadoInforme estado={informe.estado} />
          </div>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-texto">
            {rotularPeriodo(informe.periodo_tipo, informe.periodo_inicio)}
          </h1>

          <p className="mt-1 text-xs text-atenuado">
            Informe {ETIQUETAS_TIPO_PERIODO[informe.periodo_tipo].toLowerCase()} ·{' '}
            {rotularRango(informe.periodo_inicio, informe.periodo_fin)} · Actualizado el{' '}
            {formatearFechaHora(informe.actualizado_en)}
            {nombreDeQuienCreo !== null ? ` · Creado por ${nombreDeQuienCreo}` : ''}
            {' · Creado el '}
            {formatearFecha(informe.creado_en)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectorPeriodo informes={informes} informeActualId={informe.id} empresaSlug={empresa.slug} />
          {puedeEditar(usuario.rol) ? (
            <EnlaceBoton href={`/${empresa.slug}/${informe.id}/editar`} variante="secundario">
              Editar
            </EnlaceBoton>
          ) : null}
        </div>
      </header>

      {bloques.length > 0 ? (
        <ListaBloques bloques={bloques} />
      ) : (
        <EstadoVacio
          titulo="Este informe todavía no tiene contenido"
          detalle="Marketing carga aquí el estado de las campañas, las decisiones pendientes y la planificación del período."
          accion={
            puedeEditar(usuario.rol) ? (
              <EnlaceBoton href={`/${empresa.slug}/${informe.id}/editar`} variante="primario">
                Cargar contenido
              </EnlaceBoton>
            ) : undefined
          }
        />
      )}

      {tableros.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-texto">Tableros de Looker Studio</h2>
          {tableros.map((tablero) => (
            <TableroLooker key={tablero.id} tablero={tablero} />
          ))}
        </section>
      ) : null}

      <ListaEnlaces enlaces={enlaces} />
    </div>
  );
}
