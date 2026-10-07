import * as Location from 'expo-location';

// GPS del CLIENTE (foreground). Si el permiso se niega o el hardware
// falla, devuelve null y la app sigue con el orden del mock.
// El repartidor NO usa la app: el tracking es por estados (APF3).
export interface UserCoords {
  latitude: number;
  longitude: number;
}

export async function getUserCoords(timeoutMs = 8000): Promise<UserCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    // Vía rápida: última posición conocida (instantánea, sin esperar al GPS).
    const conocida = await Location.getLastKnownPositionAsync();
    if (conocida) {
      return {
        latitude: conocida.coords.latitude,
        longitude: conocida.coords.longitude,
      };
    }
    // Si no hay caché, fix fresco pero con tope: pasado el timeout
    // devolvemos null en vez de dejar el botón colgado 30 segundos.
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!pos) return null;
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
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
  if (km < 1) return `${Math.max(50, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}
