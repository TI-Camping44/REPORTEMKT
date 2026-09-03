'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Aviso } from '@/componentes/aviso';
import { BotonAccion } from '@/componentes/boton-accion';
import { Selector } from '@/componentes/campos';
import { EtiquetaRol } from '@/componentes/etiqueta';
import { cambiarEstadoDeUsuario, cambiarRolDeUsuario } from '@/acciones/usuarios';
import { ETIQUETAS_ROL_USUARIO, ROLES_USUARIO, type RolUsuario } from '@/lib/constantes';
import { formatearFecha } from '@/lib/formato';
import type { Usuario } from '@/lib/tipos';

export function TablaUsuarios({
  usuarios,
  idPropio,
}: {
  usuarios: Usuario[];
  idPropio: string;
}) {
  const router = useRouter();
  const [mensaje, establecerMensaje] = useState<string | null>(null);
  const [error, establecerError] = useState<string | null>(null);
  const [rolesElegidos, establecerRolesElegidos] = useState<Record<string, RolUsuario>>({});

  function rolDe(usuario: Usuario): RolUsuario {
    return rolesElegidos[usuario.id] ?? usuario.rol;
  }

  return (
    <div className="space-y-3">
      {mensaje !== null ? <Aviso tono="exito">{mensaje}</Aviso> : null}
      {error !== null ? <Aviso tono="error">{error}</Aviso> : null}

      <div className="desplazamiento-fino overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-borde">
              <th scope="col" className="px-3 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                Correo
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                Nombre
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                Rol actual
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                Cambiar rol
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium uppercase tracking-wide text-atenuado">
                Primer ingreso
              </th>
              <th scope="col" className="px-3 py-2 text-end font-medium uppercase tracking-wide text-atenuado">
                Acceso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {usuarios.map((usuario) => {
              const elegido = rolDe(usuario);
              const cambio = elegido !== usuario.rol;

              return (
                <tr key={usuario.id} className={usuario.activo ? '' : 'opacity-60'}>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-texto">
                    {usuario.correo}
                    {usuario.id === idPropio ? (
                      <span className="ms-1 text-micro text-atenuado">(usted)</span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-atenuado">{usuario.nombre ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <EtiquetaRol rol={usuario.rol} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Selector
                        aria-label={`Rol de ${usuario.correo}`}
                        className="w-auto py-1 text-xs"
                        value={elegido}
                        onChange={(evento) =>
                          establecerRolesElegidos((previos) => ({
                            ...previos,
                            [usuario.id]: evento.target.value as RolUsuario,
                          }))
                        }
                      >
                        {ROLES_USUARIO.map((rol) => (
                          <option key={rol} value={rol}>
                            {ETIQUETAS_ROL_USUARIO[rol]}
                          </option>
                        ))}
                      </Selector>

                      {cambio ? (
                        <BotonAccion
                          accion={() => cambiarRolDeUsuario({ usuarioId: usuario.id, rol: elegido })}
                          etiquetaCargando="Guardando…"
                          tamano="chico"
                          variante="primario"
                          alTerminar={(resultado) => {
                            establecerError(null);
                            if (resultado.exito) {
                              establecerMensaje(resultado.mensaje ?? 'Rol actualizado.');
                              router.refresh();
                            } else {
                              establecerMensaje(null);
                              establecerError(resultado.error);
                            }
                          }}
                        >
                          Aplicar
                        </BotonAccion>
                      ) : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-atenuado">
                    {formatearFecha(usuario.creado_en)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end">
                    <BotonAccion
                      accion={() =>
                        cambiarEstadoDeUsuario({ usuarioId: usuario.id, activo: !usuario.activo })
                      }
                      etiquetaCargando="Cambiando…"
                      tamano="chico"
                      variante={usuario.activo ? 'peligro' : 'secundario'}
                      deshabilitado={usuario.id === idPropio}
                      confirmacion={
                        usuario.activo
                          ? `¿Dar de baja a ${usuario.correo}? Deja de ver los informes hasta que se lo habilite de nuevo.`
                          : undefined
                      }
                      alTerminar={(resultado) => {
                        establecerError(null);
                        if (resultado.exito) {
                          establecerMensaje(resultado.mensaje ?? 'Listo.');
                          router.refresh();
                        } else {
                          establecerMensaje(null);
                          establecerError(resultado.error);
                        }
                      }}
                    >
                      {usuario.activo ? 'Dar de baja' : 'Habilitar'}
                    </BotonAccion>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-micro leading-relaxed text-atenuado">
        Los perfiles se crean solos en el primer ingreso, con rol lector. Para que alguien aparezca en
        esta lista tiene que haber entrado al menos una vez con su cuenta corporativa.
      </p>
    </div>
  );
}
