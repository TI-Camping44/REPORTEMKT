'use client';

import { AreaTexto, Etiquetado } from '@/componentes/campos';
import type { ContenidoTexto } from '@/lib/bloques';

export function EditorTexto({
  contenido,
  alCambiar,
}: {
  contenido: ContenidoTexto;
  alCambiar: (contenido: ContenidoTexto) => void;
}) {
  return (
    <Etiquetado
      etiqueta="Texto"
      ayuda="Separe los párrafos con una línea en blanco. No se interpreta Markdown."
    >
      <AreaTexto
        className="min-h-40"
        value={contenido.texto ?? ''}
        placeholder="Comentario para Gerencia General"
        onChange={(evento) => alCambiar({ texto: evento.target.value })}
      />
    </Etiquetado>
  );
}
