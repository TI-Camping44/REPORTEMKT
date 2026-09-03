'use client';

/**
 * Dominio corporativo autorizado.
 *
 * Este valor lo lee el disparador de la base de datos que crea el perfil en el
 * primer ingreso. Es la tercera capa de validacion y la unica que garantiza que
 * no quede un registro de un correo ajeno.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { CampoTexto, Etiquetado } from '@/componentes/campos';
import { guardarDominioPermitido } from '@/acciones/configuracion';

export function FormularioDominio({
  dominioEnLaBase,
  coincideConLaAplicacion,
}: {
  dominioEnLaBase: string;
  coincideConLaAplicacion: boolean;
}) {
  const router = useRouter();
  const [dominio, establecerDominio] = useState(dominioEnLaBase);
  const [mensaje, establecerMensaje] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {dominioEnLaBase === '' ? (
        <Aviso tono="error" titulo="El dominio no está configurado">
          Hasta que se cargue, ningún ingreso nuevo va a poder completarse: el disparador de la base
          rechaza la creación de la cuenta. Las personas que ya tienen perfil siguen entrando.
        </Aviso>
      ) : !coincideConLaAplicacion ? (
        <Aviso tono="advertencia" titulo="El dominio de la base y el de la aplicación no coinciden">
          La base tiene «{dominioEnLaBase}» y la variable DOMINIO_PERMITIDO de la aplicación tiene
          otro valor. Corrija la variable en Vercel para que las tres capas de validación digan lo
          mismo.
        </Aviso>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <Etiquetado
          etiqueta="Dominio corporativo"
          ayuda="Solo el dominio, sin arroba. Por ejemplo: empresa.com.py"
        >
          <CampoTexto
            className="min-w-64"
            value={dominio}
            placeholder="empresa.com.py"
            onChange={(evento) => establecerDominio(evento.target.value)}
          />
        </Etiquetado>

        <BotonAccion
          accion={() => guardarDominioPermitido(dominio)}
          etiquetaCargando="Guardando…"
          variante="primario"
          alTerminar={(resultado) => {
            if (resultado.exito) {
              establecerMensaje(resultado.mensaje ?? 'Dominio guardado.');
              router.refresh();
            }
          }}
        >
          Guardar dominio
        </BotonAccion>
      </div>

      {mensaje !== null ? <Aviso tono="exito">{mensaje}</Aviso> : null}
    </div>
  );
}
