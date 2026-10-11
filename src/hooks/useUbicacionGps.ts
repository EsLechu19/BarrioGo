import { useState } from 'react';
import { getUserCoords, UserCoords } from '../services/location';

interface Opciones {
  // Mensaje cuando el permiso se niega o no hay señal.
  mensajeSinUbicacion: string;
  // Mensaje cuando el GPS responde bien.
  mensajeExito: string;
  // Mensaje ante un error inesperado del hardware. Recibe el error crudo.
  mensajeError: (error: unknown) => string;
}

export interface UbicacionGps {
  leyendo: boolean;
  aviso: string | null;
  usar: () => Promise<UserCoords | null>;
}

// Botón "Usar mi ubicación": encapsula el estado leyendo/aviso y el GPS.
// Devuelve las coordenadas para que la pantalla las formatee a su manera.
export function useUbicacionGps(opciones: Opciones): UbicacionGps {
  const [leyendo, setLeyendo] = useState<boolean>(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function usar(): Promise<UserCoords | null> {
    if (leyendo) return null;
    setLeyendo(true);
    setAviso(null);
    try {
      const coords = await getUserCoords();
      if (!coords) {
        setAviso(opciones.mensajeSinUbicacion);
        return null;
      }
      setAviso(opciones.mensajeExito);
      return coords;
    } catch (e) {
      setAviso(opciones.mensajeError(e));
      return null;
    } finally {
      setLeyendo(false);
    }
  }

  return { leyendo, aviso, usar };
}
