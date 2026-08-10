const MAX_DIMENSION = 1600;
const CALIDAD = 0.8;

const TIPOS_COMPRIMIBLES = ['image/jpeg', 'image/png', 'image/webp'];

interface OpcionesCompresion {
  tipoSalida: 'image/jpeg' | 'image/webp';
  maxDimension?: number;
  calidad?: number;
}

/**
 * Redimensiona y recomprime una imagen en el navegador (Canvas nativo, sin
 * librerías) antes de subirla, para que ocupe menos en el bucket. PDFs, SVG
 * (vector, no tiene sentido rasterizarlo) y cualquier otro tipo no reconocido
 * pasan sin tocar. Si algo falla en el camino, se resuelve con el archivo
 * original en vez de bloquear la subida.
 */
export function comprimirImagen(archivo: File, opciones: OpcionesCompresion): Promise<File> {
  if (!TIPOS_COMPRIMIBLES.includes(archivo.type)) {
    return Promise.resolve(archivo);
  }

  const maxDimension = opciones.maxDimension ?? MAX_DIMENSION;
  const calidad = opciones.calidad ?? CALIDAD;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();

    imagen.onload = () => {
      URL.revokeObjectURL(url);

      const escala = Math.min(1, maxDimension / Math.max(imagen.width, imagen.height));
      const ancho = Math.round(imagen.width * escala);
      const alto = Math.round(imagen.height * escala);

      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(archivo);
        return;
      }
      ctx.drawImage(imagen, 0, 0, ancho, alto);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(archivo);
            return;
          }
          resolve(new File([blob], renombrarConExtension(archivo.name, opciones.tipoSalida), { type: opciones.tipoSalida }));
        },
        opciones.tipoSalida,
        calidad,
      );
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(archivo);
    };

    imagen.src = url;
  });
}

function renombrarConExtension(nombre: string, tipo: 'image/jpeg' | 'image/webp'): string {
  const extension = tipo === 'image/webp' ? 'webp' : 'jpg';
  const base = nombre.replace(/\.[^./\\]+$/, '');
  return `${base}.${extension}`;
}