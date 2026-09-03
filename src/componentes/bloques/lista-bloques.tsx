import { BloqueAlertas } from '@/componentes/bloques/bloque-alertas';
import { BloqueEnlaces } from '@/componentes/bloques/bloque-enlaces';
import { BloqueHitos } from '@/componentes/bloques/bloque-hitos';
import { BloqueIndicadores } from '@/componentes/bloques/bloque-indicadores';
import { BloqueTabla } from '@/componentes/bloques/bloque-tabla';
import { BloqueTexto } from '@/componentes/bloques/bloque-texto';
import { Tarjeta, CabeceraTarjeta, CuerpoTarjeta } from '@/componentes/tarjeta';
import { ETIQUETAS_TIPO_BLOQUE } from '@/lib/bloques';
import type {
  ContenidoAlertas,
  ContenidoEnlaces,
  ContenidoHitos,
  ContenidoIndicadores,
  ContenidoTabla,
  ContenidoTexto,
} from '@/lib/bloques';
import type { Bloque } from '@/lib/tipos';

/**
 * Elige el componente segun el tipo del bloque.
 *
 * El contenido llega como jsonb, asi que TypeScript no puede deducir su forma a
 * partir de `tipo`: la afirmacion de tipo es inevitable. La forma esta
 * documentada en src/lib/bloques.ts y en el encabezado de la migracion, y cada
 * componente tolera que falte una clave sin romperse.
 */
function ContenidoDelBloque({ bloque }: { bloque: Bloque }) {
  switch (bloque.tipo) {
    case 'indicadores':
      return <BloqueIndicadores contenido={bloque.contenido as ContenidoIndicadores} />;
    case 'hitos':
      return <BloqueHitos contenido={bloque.contenido as ContenidoHitos} />;
    case 'tabla':
      return <BloqueTabla contenido={bloque.contenido as ContenidoTabla} />;
    case 'alertas':
      return <BloqueAlertas contenido={bloque.contenido as ContenidoAlertas} />;
    case 'texto':
      return <BloqueTexto contenido={bloque.contenido as ContenidoTexto} />;
    case 'enlaces':
      return <BloqueEnlaces contenido={bloque.contenido as ContenidoEnlaces} />;
    default:
      return <p className="text-xs text-atenuado">Tipo de bloque no reconocido.</p>;
  }
}

export function ListaBloques({ bloques }: { bloques: Bloque[] }) {
  return (
    <div className="space-y-4">
      {bloques.map((bloque) => (
        <Tarjeta key={bloque.id}>
          <CabeceraTarjeta
            titulo={bloque.titulo !== '' ? bloque.titulo : ETIQUETAS_TIPO_BLOQUE[bloque.tipo]}
          />
          <CuerpoTarjeta>
            <ContenidoDelBloque bloque={bloque} />
          </CuerpoTarjeta>
        </Tarjeta>
      ))}
    </div>
  );
}
