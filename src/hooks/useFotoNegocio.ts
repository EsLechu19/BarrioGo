import { useState } from 'react';
import { subirFotoNegocio, TipoFotoNegocio } from '../services/api';
import { elegirImagen } from '../utils/imagen';

interface Opciones {
  negocioId: string | null;
  uid: string | undefined;
  // Se llama con la URL final de Cloudinary según el tipo subido.
  onSubida: (tipo: TipoFotoNegocio, url: string) => void;
}

export interface FotoNegocio {
  subiendo: TipoFotoNegocio | null;
  error: string | null;
  elegir: (tipo: TipoFotoNegocio, desdeCamara: boolean) => Promise<void>;
}

// Foto de negocio (icono cuadrado o portada 16:9): elige con cámara/galería
// y sube. Nunca crashea: permisos y cancelación se manejan con avisos.
export function useFotoNegocio({
  negocioId,
  uid,
  onSubida,
}: Opciones): FotoNegocio {
  const [subiendo, setSubiendo] = useState<TipoFotoNegocio | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subirElegida(
    tipo: TipoFotoNegocio,
    uriLocal: string,
  ): Promise<void> {
    if (!negocioId || !uid) return;
    setSubiendo(tipo);
    try {
      const url: string = await subirFotoNegocio(negocioId, uid, uriLocal, tipo);
      onSubida(tipo, url);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo subir la foto. Intentá de nuevo.',
      );
    } finally {
      setSubiendo(null);
    }
  }

  async function elegir(
    tipo: TipoFotoNegocio,
    desdeCamara: boolean,
  ): Promise<void> {
    if (subiendo || !negocioId || !uid) return;
    setError(null);
    try {
      // Icono cuadrado, portada 16:9 (el aspect solo aplica en Android; en
      // iOS el recorte siempre es cuadrado — docs SDK 57).
      const aspect: [number, number] = tipo === 'icono' ? [1, 1] : [16, 9];
      const resultado = await elegirImagen(desdeCamara, aspect);
      if (resultado.estado === 'error') {
        setError(resultado.mensaje);
        return;
      }
      if (resultado.estado === 'cancelado') return;
      await subirElegida(tipo, resultado.uri);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo elegir la foto. Intentá de nuevo.',
      );
    }
  }

  return { subiendo, error, elegir };
}
