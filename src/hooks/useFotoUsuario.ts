import { useState } from 'react';
import { subirFotoUsuario } from '../services/api';
import { elegirImagen } from '../utils/imagen';

interface Opciones {
  uid: string | undefined;
  // Se llama con la URL final de Cloudinary al terminar la subida.
  onSubida: (url: string) => void;
}

export interface FotoUsuario {
  subiendo: boolean;
  error: string | null;
  elegir: (desdeCamara: boolean) => Promise<void>;
}

// Foto de perfil del cliente: elige con cámara/galería y sube a Cloudinary.
// Nunca crashea: permisos y cancelación se manejan con avisos.
export function useFotoUsuario({ uid, onSubida }: Opciones): FotoUsuario {
  const [subiendo, setSubiendo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function subirElegida(uriLocal: string): Promise<void> {
    if (!uid) return;
    setSubiendo(true);
    try {
      const url: string = await subirFotoUsuario(uid, uriLocal);
      onSubida(url);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo subir la foto. Intentá de nuevo.',
      );
    } finally {
      setSubiendo(false);
    }
  }

  async function elegir(desdeCamara: boolean): Promise<void> {
    if (subiendo || !uid) return;
    setError(null);
    try {
      // Recorte cuadrado (avatar). El aspect solo aplica en Android; en iOS
      // el recorte ya es cuadrado (docs SDK 57).
      const resultado = await elegirImagen(desdeCamara);
      if (resultado.estado === 'error') {
        setError(resultado.mensaje);
        return;
      }
      if (resultado.estado === 'cancelado') return;
      await subirElegida(resultado.uri);
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
