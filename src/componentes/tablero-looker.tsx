import { Tarjeta, CabeceraTarjeta } from '@/componentes/tarjeta';
import { ALTO_TABLERO_POR_DEFECTO, ANCHO_MINIMO_TABLERO, PERMISOS_TABLERO } from '@/lib/constantes';
import { tableroEstaConfigurado, urlParaPestanaNueva } from '@/lib/tableros';
import type { Tablero } from '@/lib/tipos';

export function TableroLooker({ tablero }: { tablero: Tablero }) {
  const alto = tablero.alto_px > 0 ? tablero.alto_px : ALTO_TABLERO_POR_DEFECTO;

  // Sin direccion cargada no se dibuja un iframe con src vacio: se avisa que
  // el tablero esta pendiente de configuracion.
  if (!tableroEstaConfigurado(tablero.url_insercion)) {
    return (
      <Tarjeta>
        <CabeceraTarjeta titulo={tablero.nombre} />
        <div className="m-4 rounded-md border border-dashed border-borde bg-superficie px-4 py-10 text-center">
          <p className="text-sm font-medium text-texto">Tablero pendiente de configuración</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-atenuado">
            El informe de Looker Studio todavía no tiene cargada su dirección de inserción. TI puede
            cargarla desde la pantalla de administración.
          </p>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <CabeceraTarjeta
        titulo={tablero.nombre}
        descripcion="Los datos se actualizan en Looker Studio."
        acciones={
          <a
            href={urlParaPestanaNueva(tablero.url_insercion)}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md border border-borde px-2.5 py-1 text-xs text-texto transition-colors hover:bg-superficie"
          >
            Abrir en pestaña nueva
          </a>
        }
      />

      {/*
        El informe de Looker no es adaptable: se dibuja al ancho con el que fue
        disenado. Por eso el iframe conserva un ancho minimo y el desplazamiento
        horizontal vive en este contenedor, no en el cuerpo de la pagina.
      */}
      <div className="desplazamiento-fino overflow-x-auto">
        <iframe
          title={tablero.nombre}
          src={tablero.url_insercion}
          sandbox={PERMISOS_TABLERO}
          loading="lazy"
          className="block w-full border-0"
          style={{ height: `${alto}px`, minWidth: `${ANCHO_MINIMO_TABLERO}px` }}
        />
      </div>

      <p className="border-t border-borde px-4 py-2 text-micro text-atenuado">
        Si el tablero pide iniciar sesión, use «Abrir en pestaña nueva»: algunos navegadores bloquean
        las cookies de Google dentro de un informe embebido.
      </p>
    </Tarjeta>
  );
}
