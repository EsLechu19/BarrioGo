import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import {
  getUserCoords,
  permisoUbicacionOtorgado,
  type UserCoords,
} from '../services/location';

type EstadoUbicacion =
  | 'calculando'
  | 'disponible'
  | 'sin_permiso'
  | 'no_disponible';

interface UseUbicacionReturn {
  coordenadas: UserCoords | null;
  estado: EstadoUbicacion;
  reintentar: () => Promise<void>;
  abrirAjustes: () => void;
}

export function useUbicacion(): UseUbicacionReturn {
  const [coordenadas, setCoordenadas] = useState<UserCoords | null>(null);
  const [estado, setEstado] = useState<EstadoUbicacion>('calculando');
  const mountedRef = useRef<boolean>(true);

  const actualizarUbicacion = useCallback(async (): Promise<void> => {
    // getUserCoords solicita el permiso nativo cuando aún no fue concedido.
    const coords = await getUserCoords();
    const permisoOtorgado = await permisoUbicacionOtorgado();

    if (!mountedRef.current) return;

    if (coords) {
      setCoordenadas(coords);
      setEstado('disponible');
      return;
    }

    setCoordenadas(null);
    setEstado(permisoOtorgado ? 'no_disponible' : 'sin_permiso');
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void (async () => {
      await actualizarUbicacion();
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [actualizarUbicacion]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void actualizarUbicacion();
      }
    });

    return () => sub.remove();
  }, [actualizarUbicacion]);

  const reintentar = useCallback(async (): Promise<void> => {
    setEstado('calculando');
    await actualizarUbicacion();
  }, [actualizarUbicacion]);

  const abrirAjustes = useCallback((): void => {
    if (estado === 'sin_permiso') {
      void Linking.openSettings();
    }
  }, [estado]);

  return { coordenadas, estado, reintentar, abrirAjustes };
}
