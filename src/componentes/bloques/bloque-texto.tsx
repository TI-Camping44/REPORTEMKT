import type { ContenidoTexto } from '@/lib/bloques';

/** Parrafos separados por una linea en blanco. No se interpreta Markdown. */
export function BloqueTexto({ contenido }: { contenido: ContenidoTexto }) {
  const parrafos = (contenido.texto ?? '')
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter((parrafo) => parrafo !== '');

  if (parrafos.length === 0) {
    return <p className="text-xs text-atenuado">Este bloque no tiene texto cargado.</p>;
  }

  return (
    <div className="max-w-3xl space-y-2">
      {parrafos.map((parrafo, indice) => (
        <p key={indice} className="whitespace-pre-line text-sm leading-relaxed text-texto">
          {parrafo}
        </p>
      ))}
    </div>
  );
}
