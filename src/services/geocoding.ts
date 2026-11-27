type Coordenadas = { lat: number; lng: number };

type ResultadoReverse = {
  display_name?: unknown;
  address?: unknown;
};

type CacheEntry<T> = { value: T; expiresAt: number };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'BarrioGo/1.0 (Expo React Native application)';
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 100;
const REQUEST_TIMEOUT_MS = 8000;
const REQUEST_INTERVAL_MS = 1000;

const forwardCache = new Map<string, CacheEntry<Coordenadas | null>>();
const reverseCache = new Map<string, CacheEntry<string | null>>();
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidCoordinates(value: Coordenadas): boolean {
  return Number.isFinite(value.lat) && Number.isFinite(value.lng) &&
    value.lat >= -90 && value.lat <= 90 && value.lng >= -180 && value.lng <= 180;
}

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  cache.delete(key);
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  const previous = requestQueue;
  let release: () => void = () => undefined;
  requestQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const waitMs = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (waitMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
    return await operation();
  } finally {
    release();
  }
}

async function requestJson<T>(url: string): Promise<T | null> {
  return withRateLimit(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return await response.json() as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

function cachedAddressFields(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const read = (key: string): string | null => {
    const field = value[key];
    return typeof field === 'string' && field.trim() ? field.trim() : null;
  };
  const road = read('road');
  const houseNumber = read('house_number');
  const street = [road, houseNumber].filter((part): part is string => part !== null).join(' ');
  const locality = read('city') ?? read('town') ?? read('village') ?? read('municipality');
  const parts = [
    street || read('pedestrian') || read('neighbourhood') || read('suburb'),
    read('neighbourhood') ?? read('suburb') ?? read('quarter'),
    locality,
    read('state'),
    read('country'),
  ].filter((part): part is string => part !== null);
  const unique = [...new Set(parts)];
  if (unique.length > 0) return unique.join(', ');
  const displayName = value.display_name;
  return typeof displayName === 'string' && displayName.trim() ? displayName.trim() : null;
}

export async function geocodificarDireccion(address: string): Promise<Coordenadas | null> {
  const normalized = address.trim().replace(/\s+/g, ' ');
  if (normalized.length < 5 || normalized.length > 250 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    return null;
  }
  const key = normalized.toLocaleLowerCase();
  const cached = readCache(forwardCache, key);
  if (cached !== undefined) return cached;

  let url: string;
  try {
    url = `${NOMINATIM_URL}/search?format=jsonv2&limit=1&addressdetails=1&accept-language=es&q=${encodeURIComponent(normalized)}`;
  } catch {
    return null;
  }
  const results = await requestJson<unknown>(url);
  const first = Array.isArray(results) ? results[0] : null;
  let coordinates: Coordenadas | null = null;
  if (isRecord(first) && typeof first.lat === 'string' && first.lat.trim() &&
    typeof first.lon === 'string' && first.lon.trim()) {
    const parsed = { lat: Number(first.lat), lng: Number(first.lon) };
    if (isValidCoordinates(parsed)) coordinates = parsed;
  }
  writeCache(forwardCache, key, coordinates);
  return coordinates;
}

export async function reverseGeocodificarCoordenadas(
  coordinates: Coordenadas,
): Promise<string | null> {
  if (!isValidCoordinates(coordinates)) return null;
  const key = `${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}`;
  const cached = readCache(reverseCache, key);
  if (cached !== undefined) return cached;

  const url = `${NOMINATIM_URL}/reverse?format=jsonv2&addressdetails=1&accept-language=es&lat=${encodeURIComponent(String(coordinates.lat))}&lon=${encodeURIComponent(String(coordinates.lng))}`;
  const result = await requestJson<unknown>(url);
  let address: string | null = null;
  if (isRecord(result)) {
    const payload: ResultadoReverse = result;
    address = cachedAddressFields(payload.address) ??
      (typeof payload.display_name === 'string' && payload.display_name.trim()
        ? payload.display_name.trim()
        : null);
  }
  writeCache(reverseCache, key, address);
  return address;
}
