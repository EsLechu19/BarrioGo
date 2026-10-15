import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { subirFotoNegocio, TipoFotoNegocio } from '../services/api';

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
      if (desdeCamara) {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          setError('Necesitamos permiso de cámara para tomar la foto.');
          return;
        }
        const resultado = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality: 0.7,
        });
        if (resultado.canceled) return;
        const asset = resultado.assets[0];
        if (!asset) return;
        await subirElegida(tipo, asset.uri);
        return;
      }
      // Galería: no hace falta pedir permiso antes (docs SDK 57).
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.7,
      });
      // El usuario canceló → no hace nada, nunca crashea.
      if (resultado.canceled) return;
      const asset = resultado.assets[0];
      if (!asset) return;
      await subirElegida(tipo, asset.uri);
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
