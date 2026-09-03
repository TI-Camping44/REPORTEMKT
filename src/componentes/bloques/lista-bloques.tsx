import { BloqueAgenda } from '@/componentes/bloques/bloque-agenda';
import { BloqueAlertas } from '@/componentes/bloques/bloque-alertas';
import { BloqueCalendario } from '@/componentes/bloques/bloque-calendario';
import { BloqueEnlaces } from '@/componentes/bloques/bloque-enlaces';
import { BloqueFichas } from '@/componentes/bloques/bloque-fichas';
import { BloqueHitos } from '@/componentes/bloques/bloque-hitos';
import { BloqueIndicadores } from '@/componentes/bloques/bloque-indicadores';
import { BloqueLineaTiempo } from '@/componentes/bloques/bloque-linea-tiempo';
import { BloqueTabla } from '@/componentes/bloques/bloque-tabla';
import { BloqueTexto } from '@/componentes/bloques/bloque-texto';
import { CabeceraTarjeta, CuerpoTarjeta, Tarjeta } from '@/componentes/tarjeta';
import type {
  ContenidoAgenda,
  ContenidoAlertas,
  ContenidoCalendario,
  ContenidoEnlaces,
  ContenidoFichas,
  ContenidoHitos,
  ContenidoIndicadores,
  ContenidoLineaTiempo,
  ContenidoTabla,
  ContenidoTexto,
} from '@/lib/bloques';
import type { Bloque } from '@/lib/tipos';

/**
 * Dibuja el contenido de un bloque segun su tipo.
 *
 * El `contenido` viene de un jsonb y por eso se afirma su tipo aca. La forma la
 * garantizan la validacion de la accion de servidor y las restricciones de la
 * base; este es el unico punto donde se confia en eso, y esta concentrado a
 * proposito.
 */
function CuerpoBloque({ bloque, puedeEditar }: { bloque: Bloque; puedeEditar: boolean }) {
  switch (bloque.tipo) {
    case 'indicadores':
      return <BloqueIndicadores contenido={bloque.contenido as ContenidoIndicadores} />;
    case 'agenda':
      return (
        <BloqueAgenda
          bloqueId={bloque.id}
          contenido={bloque.contenido as ContenidoAgenda}
          puedeEditar={puedeEditar}
        />
      );
    case 'linea_tiempo':
      return <BloqueLineaTiempo contenido={bloque.contenido as ContenidoLineaTiempo} />;
    case 'alertas':
      return <BloqueAlertas contenido={bloque.contenido as ContenidoAlertas} />;
    case 'hitos':
      return <BloqueHitos contenido={bloque.contenido as ContenidoHitos} />;
    case 'tabla':
      return <BloqueTabla contenido={bloque.contenido as ContenidoTabla} />;
    case 'calendario':
      return <BloqueCalendario contenido={bloque.contenido as ContenidoCalendario} />;
    case 'fichas':
      return <BloqueFichas contenido={bloque.contenido as ContenidoFichas} />;
    case 'texto':
      return <BloqueTexto contenido={bloque.contenido as ContenidoTexto} />;
    case 'enlaces':
      return <BloqueEnlaces contenido={bloque.contenido as ContenidoEnlaces} />;
    default:
      return <p className="text-xs text-atenuado">Este tipo de bloque no se puede mostrar.</p>;
  }
}

function BotonDelBloque({ bloque }: { bloque: Bloque }) {
  if (bloque.accion_titulo === '' || bloque.accion_url === '') return null;

  return (
    <a
      href={bloque.accion_url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex h-7 items-center rounded-md border border-borde bg-superficie px-2.5 text-xs font-medium text-texto transition-colors hover:border-primario/50"
    >
      {bloque.accion_titulo} ↗
    </a>
  );
}

export function ListaBloques({
  bloques,
  puedeEditar,
}: {
  bloques: Bloque[];
  puedeEditar: boolean;
}) {
  if (bloques.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {bloques.map((bloque) => {
        const conCabecera = bloque.titulo !== '' || bloque.accion_titulo !== '';

        return (
          <Tarjeta key={bloque.id}>
            {conCabecera ? (
              <CabeceraTarjeta titulo={bloque.titulo} acciones={<BotonDelBloque bloque={bloque} />} />
            ) : null}
            <CuerpoTarjeta>
              <CuerpoBloque bloque={bloque} puedeEditar={puedeEditar} />
            </CuerpoTarjeta>
          </Tarjeta>
        );
      })}
    </div>
  );
}
