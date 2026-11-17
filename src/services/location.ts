
import * as Location from 'expo-location';

// Ubicación del cliente en primer plano.
export interface UserCoords {
  latitude: number;
  longitude: number;
}

// Tiempo durante el cual reutilizamos una ubicación reciente.
const CACHE_DURATION_MS = 60_000;

// Tiempo máximo de espera de una solicitud.
const DEFAULT_TIMEOUT_MS = 8000;

let cachedCoords: UserCoords | null = null;
let cachedAt = 0;

// Comparte una misma solicitud entre varias pantallas.
let pendingRequest: Promise<UserCoords | null> | null = null;

function getCachedCoords(): UserCoords | null {
  if (
    cachedCoords &&
    Date.now() - cachedAt < CACHE_DURATION_MS
  ) {
    return cachedCoords;
  }

  return null;
}

function saveCoords(coords: UserCoords): UserCoords {
  cachedCoords = coords;
  cachedAt = Date.now();
  return coords;
}

async function requestCoords(
  timeoutMs: number,
): Promise<UserCoords | null> {
  try {
    const permiso = await Location.getForegroundPermissionsAsync();

    if (permiso.status !== 'granted') {
      const solicitado =
        await Location.requestForegroundPermissionsAsync();

      if (solicitado.status !== 'granted') {
        return null;
      }
    }

    // Obtener una posición reciente sin activar una nueva
    // solicitud de posicionamiento.
    const conocida = await Location.getLastKnownPositionAsync({
      maxAge: CACHE_DURATION_MS,
    });

    if (conocida) {
      return saveCoords({
        latitude: conocida.coords.latitude,
        longitude: conocida.coords.longitude,
      });
    }

    // Obtener una posición nueva cuando no hay una reciente.
    // El timeout limita la espera, pero no cancela la operación nativa.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), timeoutMs);
    });

    const positionPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).then((position) => {
      return saveCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });

    try {
      return await Promise.race([
        positionPromise,
        timeoutPromise,
      ]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      // Evitar rechazos tardíos sin manejar.
      void positionPromise.catch(() => null);
    }
  } catch {
    return null;
  }
}

export function getUserCoords(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<UserCoords | null> {
  const cached = getCachedCoords();

  if (cached) {
    return Promise.resolve(cached);
  }

  // Evita solicitudes simultáneas.
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = requestCoords(timeoutMs);
  pendingRequest = request;

  void request.finally(() => {
    if (pendingRequest === request) {
      pendingRequest = null;
    }
  });

  return request;
}

export function haversineKm(
  a: UserCoords,
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);

  const h =
    s1 * s1 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      s2 *
      s2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistancia(km: number): string {
  if (km < 1) {
    return `${Math.max(50, Math.round(km * 1000))} m`;
  }

  return `${km.toFixed(1)} km`;
}

export async function permisoUbicacionOtorgado(): Promise<boolean> {
  try {
    const { status } =
      await Location.getForegroundPermissionsAsync();

    return status === 'granted';
  } catch {
    return false;
  }
}
