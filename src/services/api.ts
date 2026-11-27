import { CategoriaNegocio, HorarioDia, Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { EstadoRepartidor, Repartidor } from '../types/Repartidor';
import { esEstrellas, MAX_TEXTO_OPINION } from '../types/Opinion';
import type { Opinion } from '../types/Opinion';
import type { PerfilUsuario, PreferenciasUsuario, UbicacionTrabajo } from '../types/Usuario';
import {
  DireccionPedido,
  EstadoPago,
  EstadoPedido,
  ItemPedido,
  MetodoPagoPedido,
  Pedido,
} from '../types/Pedido';
import { esCategoriaNegocio, normalizarDiasSemana } from '../utils/cartaDiaria';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firebaseReady, getFirebaseAuth, getFirestoreDb } from './firebase';
// Toda lectura de datos pasa por acá, con cadena de orígenes: primero
// Firestore, luego la API local, y si no, el fallback demo (sin red).
import { negociosMock } from '../data/negociosMock';
import { productosMock } from '../data/productosMock';
import { storage } from './storage';

const MOCK_API_URL = 'http://localhost:3000/negocios';

// ---------- Caché en memoria (Fase 3) ----------
// Evita re-descargar negocio y menú en cada visita (Detalle, Home, panel).
// TTL corto: datos frescos sin castigar la fluidez. Las mutaciones del panel
// invalidan lo necesario para que no se vea información vieja.
const CACHE_TTL_MS = 60_000;

interface EntradaCache<T> {
  valor: T;
  expira: number;
}

const cacheNegocios = new Map<string, EntradaCache<Negocio[]>>();
const cacheMenu = new Map<string, EntradaCache<Producto[]>>();

function leerCache<T>(cache: Map<string, EntradaCache<T>>, clave: string): T | null {
  const entrada = cache.get(clave);
  if (!entrada) return null;
  if (Date.now() > entrada.expira) {
    cache.delete(clave);
    return null;
  }
  return entrada.valor;
}

function guardarCache<T>(cache: Map<string, EntradaCache<T>>, clave: string, valor: T): void {
  cache.set(clave, { valor, expira: Date.now() + CACHE_TTL_MS });
}

// El panel del dueño llama a estas tras crear/editar/eliminar/actualizar.
export function invalidarNegocios(): void {
  cacheNegocios.clear();
}

export function invalidarMenu(negocioId: string): void {
  cacheMenu.delete(negocioId);
}

const DEFAULT_PREFERENCES: PreferenciasUsuario = {
  notificaciones: true,
};

function isPerfilUsuario(value: unknown): value is PerfilUsuario {
  return typeof value === 'object' && value !== null &&
    typeof (value as PerfilUsuario).telefono === 'string';
}

function isUbicacionTrabajo(value: unknown): value is UbicacionTrabajo {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as UbicacionTrabajo).direccion === 'string' &&
    Number.isFinite((value as UbicacionTrabajo).lat) &&
    Number.isFinite((value as UbicacionTrabajo).lng)
  );
}

// Solo valida el campo que la app usa (notificaciones); los docs viejos con
// `ubicacion`/`ofertas` se ignoran y siguen siendo válidos.
function isPreferenciasUsuario(value: unknown): value is PreferenciasUsuario {
  return typeof value === 'object' && value !== null &&
    typeof (value as PreferenciasUsuario).notificaciones === 'boolean';
}

function validateUsuarioId(usuarioId: string): void {
  if (!usuarioId.trim()) throw new Error('Falta el usuario.');
}

export async function getPerfilUsuario(usuarioId: string): Promise<PerfilUsuario> {
  validateUsuarioId(usuarioId);
  const local = await storage.loadUserProfile(usuarioId);
  if (firebaseReady) {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), 'users', usuarioId));
      const data: unknown = snap.data();
      if (isPerfilUsuario(data)) {
        await storage.saveUserProfile(usuarioId, data);
        return data;
      }
    } catch {
      // El perfil local permite continuar sin conexión.
    }
  }
  return local ?? { telefono: '' };
}

// Nombre del usuario en `users/{uid}.nombre`. null si no hay Firebase o el
// documento no lo tiene: el negocio muestra el UID recortado.
export async function getNombreUsuario(usuarioId: string): Promise<string | null> {
  validateUsuarioId(usuarioId);
  if (!firebaseReady) return null;
  try {
    const snap = await getDoc(doc(getFirestoreDb(), 'users', usuarioId));
    const nombre: unknown = snap.data()?.nombre;
    return typeof nombre === 'string' && nombre.trim() ? nombre.trim() : null;
  } catch {
    return null;
  }
}

// Dirección de trabajo del dueño copiada desde su negocio. null si la
// cuenta no tiene el campo (cliente o reglas viejas).
export async function getUbicacionTrabajo(
  usuarioId: string,
): Promise<UbicacionTrabajo | null> {
  validateUsuarioId(usuarioId);
  if (!firebaseReady) return null;
  try {
    const snap = await getDoc(doc(getFirestoreDb(), 'users', usuarioId));
    const raw: unknown = snap.data()?.ubicacionTrabajo;
    return isUbicacionTrabajo(raw) ? raw : null;
  } catch {
    return null;
  }
}

// Escritura best-effort: con reglas viejas el campo se rechaza y no debe
// romper registrar/editar el negocio (se completa al publicar reglas nuevas).
async function guardarUbicacionTrabajo(
  usuarioId: string,
  ubicacion: UbicacionTrabajo,
): Promise<void> {
  if (!firebaseReady || !isUbicacionTrabajo(ubicacion)) return;
  try {
    await setDoc(
      doc(getFirestoreDb(), 'users', usuarioId),
      { ubicacionTrabajo: ubicacion },
      { merge: true },
    );
  } catch {
    // Reglas desactualizadas: el dato queda pendiente, nada más.
  }
}

export async function actualizarPerfilUsuario(
  usuarioId: string,
  profile: PerfilUsuario,
): Promise<void> {
  validateUsuarioId(usuarioId);
  const telefono = profile.telefono.trim();
  if (telefono && !/^\d+$/.test(telefono.replace(/\s/g, ''))) {
    throw new Error('El teléfono no es válido.');
  }
  const safeProfile: PerfilUsuario = { telefono };
  await storage.saveUserProfile(usuarioId, safeProfile);
  if (firebaseReady) {
    await setDoc(doc(getFirestoreDb(), 'users', usuarioId), safeProfile, {
      merge: true,
    });
  }
}

export async function getPreferenciasUsuario(
  usuarioId: string,
): Promise<PreferenciasUsuario> {
  validateUsuarioId(usuarioId);
  const local = await storage.loadUserPreferences(usuarioId);
  if (firebaseReady) {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), 'users', usuarioId));
      const raw: unknown = snap.data()?.preferencias;
      if (isPreferenciasUsuario(raw)) {
        await storage.saveUserPreferences(usuarioId, raw);
        return raw;
      }
    } catch {
      // Se usa la copia local validada.
    }
  }
  return local ?? DEFAULT_PREFERENCES;
}

export async function actualizarPreferenciasUsuario(
  usuarioId: string,
  preferences: PreferenciasUsuario,
): Promise<void> {
  validateUsuarioId(usuarioId);
  if (!isPreferenciasUsuario(preferences)) {
    throw new Error('Las preferencias no son válidas.');
  }
  await storage.saveUserPreferences(usuarioId, preferences);
  if (firebaseReady) {
    await setDoc(
      doc(getFirestoreDb(), 'users', usuarioId),
      { preferencias: preferences },
      { merge: true },
    );
  }
}

export interface AppError {
  message: string;
  code: 'network' | 'server' | 'parse';
}

export type OrigenNegocios = 'firestore' | 'api-local' | 'fallback-local';

export interface ResultadoNegocios {
  negocios: Negocio[];
  origen: OrigenNegocios;
  advertencia: string | null;
}

function isNegocio(value: unknown): value is Negocio {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Negocio).id === 'string' &&
    typeof (value as Negocio).nombre === 'string'
  );
}

function isNegocioArray(value: unknown): value is Negocio[] {
  return Array.isArray(value) && value.every(isNegocio);
}

function isProductoArray(value: unknown): value is Producto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Producto).id === 'string' &&
        typeof (item as Producto).negocioId === 'string',
    )
  );
}

async function getNegociosFromMockServer(): Promise<Negocio[] | null> {
  try {
    const response = await fetch(MOCK_API_URL);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return isNegocioArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

export async function getNegocios(): Promise<Negocio[]> {
  const resultado: ResultadoNegocios = await getNegociosConOrigen();
  return resultado.negocios;
}

export async function getNegociosConOrigen(): Promise<ResultadoNegocios> {
  // Caché al toque: Home/Restaurantes no vuelven a descargar la colección.
  const enCache = leerCache(cacheNegocios, 'todos');
  if (enCache) {
    return { negocios: enCache, origen: 'firestore', advertencia: null };
  }
  let firestoreNoDisponible = false;

  // 1. Firestore
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(getFirestoreDb(), 'negocios'));
      const data: unknown = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isNegocioArray(data) && data.length > 0) {
        guardarCache(cacheNegocios, 'todos', data);
        return { negocios: data, origen: 'firestore', advertencia: null };
      }
      firestoreNoDisponible = true;
    } catch {
      // cae al siguiente origen
      firestoreNoDisponible = true;
    }
  }
  // 2. API local
  const mock = await getNegociosFromMockServer();
  if (mock) {
    return {
      negocios: mock,
      origen: 'api-local',
      advertencia: firestoreNoDisponible
        ? 'Firestore no disponible; usando API local.'
        : null,
    };
  }
  // 3. Fallback local
  return {
    negocios: [...negociosMock],
    origen: 'fallback-local',
    advertencia: 'Sin conexión al servidor; mostrando datos locales de demostración.',
  };
}

export async function getNegocioById(id: string): Promise<Negocio | null> {
  // Reusa la colección cacheada si está fresca (evita la lectura puntual).
  const lista = leerCache(cacheNegocios, 'todos');
  if (lista) return lista.find((n) => n.id === id) ?? null;
  if (firebaseReady) {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), 'negocios', id));
      const data: unknown = snap.exists()
        ? { id: snap.id, ...snap.data() }
        : null;
      if (data && isNegocio(data)) return data;
    } catch {
      // cae al siguiente origen
    }
  }
  const negocios = await getNegocios();
  return negocios.find((n) => n.id === id) ?? null;
}

export async function getMenu(negocioId: string): Promise<Producto[]> {
  // Menú cacheado: en revisitas Detalle abre sin esperar red.
  const enCache = leerCache(cacheMenu, negocioId);
  if (enCache) return enCache;
  if (firebaseReady) {
    try {
      const q = query(
        collection(getFirestoreDb(), 'productos'),
        where('negocioId', '==', negocioId),
      );
      const snap = await getDocs(q);
      const data: unknown = snap.docs.map((d) =>
        mapProductoSnapshot(d.id, d.data() as Record<string, unknown>),
      );
      if (isProductoArray(data) && data.length > 0) {
        guardarCache(cacheMenu, negocioId, data);
        return data;
      }
    } catch {
      // cae al fallback local
    }
  } else {
    // Sin Firebase, delay para evidenciar loading en Detalle.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return productosMock.filter((p) => p.negocioId === negocioId);
}

// ---------- F3 Pedidos con tracking ----------

const FIREBASE_NO_CONFIG_MSG =
  'Firebase no configurado: falta el .env (ver .env.example)';

export interface CrearPedidoInput {
  usuarioId: string;
  negocioId: string;
  items: ItemPedido[];
  total: number;
  direccion?: DireccionPedido;
  metodoPago?: MetodoPagoPedido;
  // Snapshot del nombre del cliente al confirmar, para que el negocio lo vea
  // en sus pedidos sin tener que leer el perfil de cada usuario.
  clienteNombre?: string;
  // Snapshot del nombre del negocio al confirmar: la lista de pedidos del
  // cliente lo muestra aunque el negocio no exista en el catálogo local.
  negocioNombre?: string;
}

const ESTADOS_PEDIDO: readonly EstadoPedido[] = [
  'pendiente',
  'confirmado',
  'en_camino',
  'entregado',
  'cancelado',
];

function isEstadoPedido(value: unknown): value is EstadoPedido {
  return (
    typeof value === 'string' &&
    (ESTADOS_PEDIDO as readonly string[]).includes(value)
  );
}

const ESTADOS_PAGO: readonly EstadoPago[] = ['pendiente', 'pagado', 'fallido'];

function isEstadoPago(value: unknown): value is EstadoPago {
  return (
    typeof value === 'string' && (ESTADOS_PAGO as readonly string[]).includes(value)
  );
}

function isItemPedido(value: unknown): value is ItemPedido {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ItemPedido).productoId === 'string' &&
    Number.isFinite((value as ItemPedido).cantidad) &&
    (value as ItemPedido).cantidad > 0 &&
    Number.isFinite((value as ItemPedido).precioUnitario) &&
    (value as ItemPedido).precioUnitario >= 0
  );
}

// Firestore rechaza undefined: quita esas claves antes de escribir el item
// (por si el carrito viejo o el llamador las traen).
function limpiarCamposUndefined(item: ItemPedido): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(item).filter(([, valor]) => valor !== undefined),
  );
}

function mapProductoSnapshot(id: string, data: Record<string, unknown>): Producto {
  // El panel escribe `imagenUrl` y el seed usa `imagen`: se acepta el que
  // exista, o las fotos del seed no se verían.
  const imagenUrl: unknown =
    typeof data.imagenUrl === 'string' && data.imagenUrl.trim() ? data.imagenUrl : data.imagen;
  const categoriaProducto: unknown = data.categoriaProducto;
  const disponible: unknown = data.disponible;
  const diasSemana: number[] | undefined = normalizarDiasSemana(data.diasSemana);
  return {
    id,
    negocioId: String(data.negocioId ?? ''),
    nombre: String(data.nombre ?? ''),
    precio: typeof data.precio === 'number' ? data.precio : Number(data.precio ?? 0),
    descripcion: typeof data.descripcion === 'string' ? data.descripcion : '',
    ...(typeof imagenUrl === 'string' && imagenUrl.trim() ? { imagen: imagenUrl } : {}),
    ...(typeof categoriaProducto === 'string' && categoriaProducto.trim()
      ? { categoriaProducto }
      : {}),
    ...(typeof disponible === 'boolean' ? { disponible } : {}),
    ...(diasSemana ? { diasSemana } : {}),
  };
}

function isDireccionPedido(value: unknown): value is DireccionPedido {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DireccionPedido).alias === 'string' &&
    (value as DireccionPedido).alias.trim().length > 0 &&
    typeof (value as DireccionPedido).detalle === 'string' &&
    (value as DireccionPedido).detalle.trim().length > 0
  );
}

function isMetodoPagoPedido(value: unknown): value is MetodoPagoPedido {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as MetodoPagoPedido).tipo === 'string' &&
    (value as MetodoPagoPedido).tipo.trim().length > 0 &&
    typeof (value as MetodoPagoPedido).nombre === 'string' &&
    (value as MetodoPagoPedido).nombre.trim().length > 0
  );
}

function isPedido(value: unknown): value is Pedido {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Pedido;
  return (
    typeof p.id === 'string' &&
    typeof p.usuarioId === 'string' &&
    typeof p.negocioId === 'string' &&
    Array.isArray(p.items) &&
    p.items.every(isItemPedido) &&
    typeof p.total === 'number' &&
    isEstadoPedido(p.estado) &&
    typeof p.fecha === 'string' &&
    (p.canceladoPor === undefined || typeof p.canceladoPor === 'string') &&
    (p.canceladoFecha === undefined || typeof p.canceladoFecha === 'string') &&
    (p.direccion === undefined || isDireccionPedido(p.direccion)) &&
    (p.metodoPago === undefined || isMetodoPagoPedido(p.metodoPago)) &&
    (p.clienteNombre === undefined || typeof p.clienteNombre === 'string') &&
    (p.negocioNombre === undefined || typeof p.negocioNombre === 'string') &&
    (p.estadoPago === undefined || isEstadoPago(p.estadoPago)) &&
    (p.pagoActivoId === undefined || typeof p.pagoActivoId === 'string') &&
    (p.envio === undefined ||
      (typeof p.envio === 'number' && Number.isFinite(p.envio) && p.envio >= 0))
  );
}

export async function crearPedido(input: CrearPedidoInput): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.usuarioId.trim()) throw new Error('Falta el usuario del pedido.');
  if (!input.negocioId.trim()) throw new Error('Falta el negocio del pedido.');
  if (input.items.length === 0) throw new Error('El pedido no tiene productos.');
  if (!input.items.every(isItemPedido)) {
    throw new Error('El pedido contiene productos no válidos.');
  }
  if (
    input.items.some(
      (item) => item.negocioId !== undefined && item.negocioId !== input.negocioId,
    )
  ) {
    throw new Error('El pedido contiene productos de otro restaurante.');
  }
  const totalCalculadoCentavos = input.items.reduce(
    (acumulado, item) =>
      acumulado + Math.round(item.cantidad * item.precioUnitario * 100),
    0,
  );
  const totalInformadoCentavos = Math.round(input.total * 100);
  if (
    !(input.total > 0) ||
    !Number.isFinite(input.total) ||
    totalInformadoCentavos !== totalCalculadoCentavos
  ) {
    throw new Error('El total del pedido no coincide con sus productos.');
  }
  if (input.direccion !== undefined && !isDireccionPedido(input.direccion)) {
    throw new Error('La dirección de entrega no es válida.');
  }
  if (input.metodoPago !== undefined && !isMetodoPagoPedido(input.metodoPago)) {
    throw new Error('El método de pago no es válido.');
  }
  try {
    const ref = await addDoc(collection(getFirestoreDb(), 'pedidos'), {
      usuarioId: input.usuarioId,
      negocioId: input.negocioId,
      items: input.items.map(limpiarCamposUndefined),
      total: input.total,
      ...(input.direccion ? { direccion: input.direccion } : {}),
      ...(input.metodoPago ? { metodoPago: input.metodoPago } : {}),
      ...(input.clienteNombre?.trim()
        ? { clienteNombre: input.clienteNombre.trim() }
        : {}),
      ...(input.negocioNombre?.trim()
        ? { negocioNombre: input.negocioNombre.trim() }
        : {}),
      estado: 'pendiente',
      fecha: new Date().toISOString(),
    });
    return ref.id;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo crear el pedido: ${e.message}`
        : 'No se pudo crear el pedido. Intentá de nuevo.',
    );
  }
}

export interface CrearPedidosInput {
  usuarioId: string;
  items: ItemPedido[];
  total: number;
  // Costo de envío por negocio (soles). Se suma al total y se guarda en cada
  // subpedido como `envio`. Negocios sin costo no aparecen.
  envios?: Record<string, number>;
  direccion?: DireccionPedido;
  metodoPago?: MetodoPagoPedido;
  clienteNombre?: string;
  // Snapshot de nombre de negocio por id, para el subpedido de cada negocio.
  nombresNegocio?: Record<string, string>;
  // Resultado del pago simulado (Fase 3). Queda guardado en cada pedido.
  estadoPago?: EstadoPago;
}

// Confirma un carrito: crea UN pedido por negocio (uno por cada local) en un
// solo batch. Devuelve los pedidos creados (id + negocio) en el mismo orden
// en que se agruparon los negocios.
export async function crearPedidos(
  input: CrearPedidosInput,
): Promise<{ id: string; negocioId: string }[]> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.usuarioId.trim()) throw new Error('Falta el usuario del pedido.');
  if (input.items.length === 0) throw new Error('El pedido no tiene productos.');
  if (!input.items.every(isItemPedido)) {
    throw new Error('El pedido contiene productos no válidos.');
  }
  if (input.items.some((item) => !item.negocioId?.trim())) {
    throw new Error(
      'Hay un producto sin restaurante. Volvé a agregarlo desde su menú.',
    );
  }
  const totalCalculadoCentavos = input.items.reduce(
    (acumulado, item) =>
      acumulado + Math.round(item.cantidad * item.precioUnitario * 100),
    0,
  );
  // Envíos: por negocio, deben ser >= 0 y solo de negocios del pedido.
  const envios: Record<string, number> = input.envios ?? {};
  const idsConProductos = new Set(
    input.items.map((item) => (item.negocioId ?? '').trim()),
  );
  let enviosCentavos = 0;
  for (const [negocioId, costo] of Object.entries(envios)) {
    if (typeof costo !== 'number' || !Number.isFinite(costo) || costo < 0) {
      throw new Error('El costo de envío no es válido.');
    }
    if (!idsConProductos.has(negocioId)) {
      throw new Error('El envío no corresponde a un negocio del pedido.');
    }
    enviosCentavos += Math.round(costo * 100);
  }
  const totalInformadoCentavos = Math.round(input.total * 100);
  if (
    !(input.total > 0) ||
    !Number.isFinite(input.total) ||
    totalInformadoCentavos !== totalCalculadoCentavos + enviosCentavos
  ) {
    throw new Error('El total del pedido no coincide con sus productos.');
  }
  if (input.direccion !== undefined && !isDireccionPedido(input.direccion)) {
    throw new Error('La dirección de entrega no es válida.');
  }
  if (input.metodoPago !== undefined && !isMetodoPagoPedido(input.metodoPago)) {
    throw new Error('El método de pago no es válido.');
  }
  if (input.estadoPago !== undefined && !isEstadoPago(input.estadoPago)) {
    throw new Error('El estado del pago no es válido.');
  }

  // Agrupa los items por negocio (respetando el orden de aparición).
  const porNegocio: Map<string, ItemPedido[]> = new Map();
  for (const item of input.items) {
    const negocioId: string = (item.negocioId ?? '').trim();
    const grupo: ItemPedido[] = porNegocio.get(negocioId) ?? [];
    grupo.push(item);
    porNegocio.set(negocioId, grupo);
  }

  try {
    const db = getFirestoreDb();
    const fecha: string = new Date().toISOString();
    const batch = writeBatch(db);

    // Un pedido por cada negocio del carrito.
    const subRefs: { ref: ReturnType<typeof doc>; negocioId: string; grupo: ItemPedido[] }[] =
      [];
    for (const [negocioId, grupo] of porNegocio) {
      subRefs.push({ ref: doc(collection(db, 'pedidos')), negocioId, grupo });
    }

    for (const { ref: subRef, negocioId, grupo } of subRefs) {
      const totalSubCentavos = grupo.reduce(
        (acumulado, item) =>
          acumulado + Math.round(item.cantidad * item.precioUnitario * 100),
        0,
      );
      const envioSubCentavos = Math.round((envios[negocioId] ?? 0) * 100);
      const nombreNegocio = input.nombresNegocio?.[negocioId]?.trim();
      batch.set(subRef, {
        usuarioId: input.usuarioId,
        negocioId,
        items: grupo.map(limpiarCamposUndefined),
        // El pedido incluye su propio envío en el total.
        total: (totalSubCentavos + envioSubCentavos) / 100,
        ...(envioSubCentavos > 0
          ? { envio: envioSubCentavos / 100 }
          : {}),
        ...(input.direccion ? { direccion: input.direccion } : {}),
        ...(input.metodoPago ? { metodoPago: input.metodoPago } : {}),
        ...(input.clienteNombre?.trim()
          ? { clienteNombre: input.clienteNombre.trim() }
          : {}),
        ...(nombreNegocio ? { negocioNombre: nombreNegocio } : {}),
        ...(input.estadoPago ? { estadoPago: input.estadoPago } : {}),
        estado: 'pendiente',
        fecha,
      });
    }

    await batch.commit();
    return subRefs.map((subRef) => ({
      id: subRef.ref.id,
      negocioId: subRef.negocioId,
    }));
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo crear el pedido: ${e.message}`
        : 'No se pudo crear el pedido. Intentá de nuevo.',
    );
  }
}

export interface ResultadoPagoSimulado {
  estado: EstadoPago;
  mensaje: string;
}

// ids de los métodos simulados de MetodosPagoScreen (METODOS_MOCK).
const TIPO_PAGO_EFECTIVO = 'm1';
const TIPO_PAGO_YAPE = 'm2';
const TIPO_PAGO_TARJETA = 'm3';

// Pago simulado (sin dinero real). Efectivo queda pendiente, Yape siempre
// aprueba, tarjeta falla al primer intento y aprueba al reintentar.
export async function simularPago(
  metodo: MetodoPagoPedido,
  esReintento: boolean,
): Promise<ResultadoPagoSimulado> {
  const tipo: string = metodo.tipo.trim();
  if (![TIPO_PAGO_EFECTIVO, TIPO_PAGO_YAPE, TIPO_PAGO_TARJETA].includes(tipo)) {
    throw new Error('El método de pago no es válido.');
  }
  // Pequeña pausa para que la app muestre el estado de "procesando".
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (tipo === TIPO_PAGO_EFECTIVO) {
    return {
      estado: 'pendiente',
      mensaje: 'El pago en efectivo se realiza al recibir el pedido.',
    };
  }
  if (tipo === TIPO_PAGO_YAPE) {
    return {
      estado: 'pagado',
      mensaje: 'Pago con Yape aprobado (simulación).',
    };
  }
  if (esReintento) {
    return {
      estado: 'pagado',
      mensaje: 'Pago con tarjeta aprobado (simulación).',
    };
  }
  return {
    estado: 'fallido',
    mensaje:
      'La tarjeta fue declinada en la simulación. Reintentá el pago o elegí otro método.',
  };
}

// Actualiza el pago de uno o más pedidos tras un reintento.
// No toca el estado ni la cancelación del pedido.
export async function actualizarEstadoPago(
  pedidoIds: string[],
  estado: EstadoPago,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (pedidoIds.length === 0) throw new Error('Falta el pedido a actualizar.');
  if (!isEstadoPago(estado)) throw new Error('El estado del pago no es válido.');
  try {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    for (const id of pedidoIds) {
      batch.update(doc(db, 'pedidos', id), { estadoPago: estado });
    }
    await batch.commit();
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo actualizar el pago: ${e.message}`
        : 'No se pudo actualizar el pago. Intentá de nuevo.',
    );
  }
}

export function escucharMisPedidos(
  usuarioId: string,
  cb: (pedidos: Pedido[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!firebaseReady) return () => {};
  if (!usuarioId.trim()) return () => {};
  try {
    const q = query(
      collection(getFirestoreDb(), 'pedidos'),
      where('usuarioId', '==', usuarioId),
    );
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        // Do not expose local writes before Firestore confirms them.
        if (snap.metadata.hasPendingWrites) return;
        try {
          const data: unknown = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          const pedidos: Pedido[] = Array.isArray(data)
            ? data.filter(isPedido).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
            : [];
          cb(pedidos);
        } catch (e) {
          onError?.(
            e instanceof Error
              ? e
              : new Error('No se pudieron leer tus pedidos.'),
          );
        }
      },
      (err: Error) => {
        onError?.(
          err instanceof Error
            ? err
            : new Error('Se perdió la conexión con tus pedidos.'),
        );
      },
    );
  } catch (e) {
    onError?.(
      e instanceof Error
        ? e
        : new Error('No se pudo escuchar tus pedidos.'),
    );
    return () => {};
  }
}

// ---------- F4 Panel negocio ----------

export function escucharPedidosNegocio(
  negocioId: string,
  cb: (pedidos: Pedido[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!firebaseReady) return () => {};
  if (!negocioId.trim()) return () => {};
  try {
    // Sin orderBy a propósito (igual que F3): where + orderBy exige índice
    // compuesto en Firestore. Ordenamos en memoria (fecha desc).
    const q = query(
      collection(getFirestoreDb(), 'pedidos'),
      where('negocioId', '==', negocioId),
    );
    return onSnapshot(
      q,
      (snap) => {
        try {
          const data: unknown = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          const pedidos: Pedido[] = Array.isArray(data)
            ? data.filter(isPedido).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
            : [];
          cb(pedidos);
        } catch (e) {
          onError?.(
            e instanceof Error
              ? e
              : new Error('No se pudieron leer los pedidos del negocio.'),
          );
        }
      },
      (err: Error) => {
        onError?.(
          err instanceof Error
            ? err
            : new Error('Se perdió la conexión con los pedidos del negocio.'),
        );
      },
    );
  } catch (e) {
    onError?.(
      e instanceof Error
        ? e
        : new Error('No se pudo escuchar los pedidos del negocio.'),
    );
    return () => {};
  }
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!pedidoId.trim()) throw new Error('Falta el id del pedido.');
  if (!isEstadoPedido(estado)) throw new Error('El estado del pedido no es válido.');
  try {
    const ref = doc(getFirestoreDb(), 'pedidos', pedidoId);
    const snap = await getDoc(ref);
    const data: unknown = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    if (!isPedido(data)) throw new Error('El pedido no existe o no es válido.');
    if (
      data.metodoPago?.tipo === 'mercadopago_sandbox' &&
      data.estadoPago !== 'pagado'
    ) {
      throw new Error('El pago de Mercado Pago todavía no está confirmado.');
    }
    const siguiente: EstadoPedido | undefined =
      data.estado === 'pendiente'
        ? 'confirmado'
        : data.estado === 'confirmado'
          ? 'en_camino'
          : data.estado === 'en_camino'
            ? 'entregado'
            : undefined;
    if (siguiente !== estado) {
      throw new Error('La transición de estado del pedido no es válida.');
    }
    await updateDoc(ref, { estado });
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El pedido no existe o no es válido.' ||
        e.message === 'El pago de Mercado Pago todavía no está confirmado.' ||
        e.message === 'La transición de estado del pedido no es válida.')
    ) {
      throw e;
    }
    throw new Error(
      e instanceof Error
        ? `No se pudo cambiar el estado del pedido: ${e.message}`
        : 'No se pudo cambiar el estado del pedido. Intentá de nuevo.',
    );
  }
}

export async function rechazarPedidoNegocio(pedidoId: string): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!pedidoId.trim()) throw new Error('Falta el id del pedido.');
  const actor = getFirebaseAuth().currentUser;
  if (!actor) throw new Error('La sesión del negocio no está disponible.');
  const ref = doc(getFirestoreDb(), 'pedidos', pedidoId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('El pedido no existe.');
    const data: unknown = { id: snap.id, ...snap.data() };
    if (!isPedido(data)) throw new Error('El pedido no tiene un formato válido.');
    if (
      data.metodoPago?.tipo === 'mercadopago_sandbox' &&
      data.estadoPago !== 'pagado'
    ) {
      throw new Error('El pago de Mercado Pago todavía no está confirmado.');
    }
    if (data.estado !== 'pendiente') {
      throw new Error('Solo se puede rechazar un pedido pendiente.');
    }
    await updateDoc(ref, {
      estado: 'cancelado',
      canceladoPor: actor.uid,
      canceladoFecha: new Date().toISOString(),
    });
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El pedido no existe.' ||
        e.message === 'El pedido no tiene un formato válido.' ||
        e.message === 'El pago de Mercado Pago todavía no está confirmado.' ||
        e.message === 'Solo se puede rechazar un pedido pendiente.')
    ) {
      throw e;
    }
    throw new Error(
      e instanceof Error
        ? `No se pudo rechazar el pedido: ${e.message}`
        : 'No se pudo rechazar el pedido. Intentá de nuevo.',
    );
  }
}

export function puedeCancelarPedido(pedido: Pedido): boolean {
  if (pedido.estado !== 'pendiente' || pedido.pagoActivoId) return false;
  return pedido.metodoPago?.tipo !== 'mercadopago_sandbox' ||
    pedido.estadoPago === 'fallido';
}

export async function cancelarPedido(
  pedidoId: string,
  usuarioId: string,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!pedidoId.trim()) throw new Error('Falta el id del pedido.');
  if (!usuarioId.trim()) throw new Error('Falta el usuario del pedido.');
  const ref = doc(getFirestoreDb(), 'pedidos', pedidoId);
  try {
    await runTransaction(getFirestoreDb(), async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error('El pedido no existe.');
      const data: unknown = { id: snap.id, ...snap.data() };
      if (!isPedido(data)) throw new Error('El pedido no tiene un formato válido.');
      if (data.usuarioId !== usuarioId) {
        throw new Error('Solo podés cancelar tus propios pedidos.');
      }
      if (data.estado !== 'pendiente') {
        throw new Error('El pedido ya fue aceptado y no se puede cancelar.');
      }
      if (!puedeCancelarPedido(data)) {
        throw new Error('No puedes cancelar mientras el pago de Mercado Pago esté pendiente o aprobado.');
      }
      transaction.update(ref, {
        estado: 'cancelado',
        canceladoPor: usuarioId,
        canceladoFecha: new Date().toISOString(),
      });
    });
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El pedido no existe.' ||
        e.message === 'El pedido no tiene un formato válido.' ||
        e.message === 'Solo podés cancelar tus propios pedidos.' ||
        e.message === 'El pedido ya fue aceptado y no se puede cancelar.' ||
        e.message === 'No puedes cancelar mientras el pago de Mercado Pago esté pendiente o aprobado.')
    ) {
      throw e;
    }
    throw new Error(
      e instanceof Error
        ? `No se pudo cancelar el pedido: ${e.message}`
        : 'No se pudo cancelar el pedido. Intentá de nuevo.',
    );
  }
}

export interface CrearProductoInput {
  negocioId: string;
  usuarioId: string;
  nombre: string;
  // Opcional: el form de restaurante no envía precio (el cobro sale del
  // menú del día / extra del negocio).
  precio?: number;
  descripcion?: string;
  imagenUrl?: string;
  categoriaProducto?: string;
  // Carta diaria: días en que el plato aparece (0 = domingo).
  diasSemana?: number[];
}

async function verificarDuenoNegocio(
  negocioId: string,
  usuarioId: string,
): Promise<void> {
  if (!usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  const usuarioAutenticado: string | undefined = getFirebaseAuth().currentUser?.uid;
  if (!usuarioAutenticado || usuarioAutenticado !== usuarioId) {
    throw new Error('La sesión del negocio no es válida.');
  }
  const snap = await getDoc(doc(getFirestoreDb(), 'negocios', negocioId));
  if (!snap.exists()) throw new Error('El negocio no existe.');
  const data: unknown = snap.data();
  const duenoId: unknown =
    typeof data === 'object' && data !== null
      ? (data as { duenioId?: unknown }).duenioId
      : undefined;
  if (typeof duenoId !== 'string' || duenoId !== usuarioId) {
    throw new Error('Solo el dueño puede modificar este negocio.');
  }
}

export async function crearProducto(input: CrearProductoInput): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.negocioId.trim()) throw new Error('Falta el negocio del producto.');
  if (!input.usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  if (!input.nombre.trim()) throw new Error('El producto necesita un nombre.');
  if (input.precio !== undefined && !(input.precio > 0)) throw new Error('El precio debe ser mayor a 0.');
  try {
    await verificarDuenoNegocio(input.negocioId, input.usuarioId);
    const ref = await addDoc(collection(getFirestoreDb(), 'productos'), {
      negocioId: input.negocioId,
      nombre: input.nombre.trim(),
      precio: input.precio ?? 0,
      descripcion: input.descripcion?.trim() ?? '',
      imagenUrl: input.imagenUrl?.trim() ?? '',
      ...(input.categoriaProducto?.trim()
        ? { categoriaProducto: input.categoriaProducto.trim() }
        : {}),
      ...(input.diasSemana && input.diasSemana.length > 0
        ? { diasSemana: input.diasSemana }
        : {}),
      disponible: true,
    });
    invalidarMenu(input.negocioId);
    return ref.id;
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El negocio no existe.' ||
        e.message === 'Solo el dueño puede modificar este negocio.' ||
        e.message === 'La sesión del negocio no es válida.')
    ) {
      throw e;
    }
    throw new Error(
      e instanceof Error
        ? `No se pudo crear el producto: ${e.message}`
        : 'No se pudo crear el producto. Intentá de nuevo.',
    );
  }
}

export interface ActualizarProductoInput {
  productoId: string;
  negocioId: string;
  usuarioId: string;
  nombre: string;
  // Opcional: el form de restaurante no envía precio.
  precio?: number;
  descripcion?: string;
  imagenUrl: string;
  categoriaProducto?: string;
  // Carta diaria: días en que el plato aparece (0 = domingo).
  diasSemana?: number[];
}

export async function actualizarProducto(input: ActualizarProductoInput): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.productoId.trim()) throw new Error('Falta el producto a editar.');
  if (!input.negocioId.trim()) throw new Error('Falta el negocio del producto.');
  if (!input.nombre.trim()) throw new Error('El producto necesita un nombre.');
  if (input.precio !== undefined && !(input.precio > 0)) throw new Error('El precio debe ser mayor a 0.');
  try {
    await verificarDuenoNegocio(input.negocioId, input.usuarioId);
    const ref = doc(getFirestoreDb(), 'productos', input.productoId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('El producto no existe.');
    if (snap.data().negocioId !== input.negocioId) {
      throw new Error('El producto no pertenece a este negocio.');
    }
    const cambios: { [campo: string]: string | number | number[] } = {
      nombre: input.nombre.trim(),
      imagenUrl: input.imagenUrl.trim(),
    };
    if (input.precio !== undefined) cambios['precio'] = input.precio;
    if (input.descripcion !== undefined)
      cambios['descripcion'] = input.descripcion.trim();
    if (input.categoriaProducto !== undefined)
      cambios['categoriaProducto'] = input.categoriaProducto.trim();
    if (input.diasSemana !== undefined) cambios['diasSemana'] = input.diasSemana;
    await updateDoc(ref, cambios);
    invalidarMenu(input.negocioId);
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El negocio no existe.' ||
        e.message === 'El producto no existe.' ||
        e.message === 'El producto no pertenece a este negocio.' ||
        e.message === 'Solo el dueño puede modificar este negocio.' ||
        e.message === 'La sesión del negocio no es válida.')
    ) {
      throw e;
    }
    throw new Error(
      e instanceof Error
        ? `No se pudo actualizar el producto: ${e.message}`
        : 'No se pudo actualizar el producto. Intentá de nuevo.',
    );
  }
}

// ---------- Pausa y baja de platos (Fase 5) ----------
// Pausar marca `disponible: false`; eliminar hace deleteDoc.

function errorProductoPassthrough(e: Error): boolean {
  return (
    e.message === 'El negocio no existe.' ||
    e.message === 'El producto no existe.' ||
    e.message === 'El producto no pertenece a este negocio.' ||
    e.message === 'Solo el dueño puede modificar este negocio.' ||
    e.message === 'La sesión del negocio no es válida.'
  );
}

async function verificarProductoDelNegocio(
  productoId: string,
  negocioId: string,
  usuarioId: string,
): Promise<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> {
  await verificarDuenoNegocio(negocioId, usuarioId);
  const ref = doc(getFirestoreDb(), 'productos', productoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('El producto no existe.');
  if (snap.data().negocioId !== negocioId) {
    throw new Error('El producto no pertenece a este negocio.');
  }
  return { ref, data: snap.data() as Record<string, unknown> };
}

// Devuelve el nuevo valor de `disponible` tras alternarlo.
export async function alternarDisponibleProducto(
  productoId: string,
  negocioId: string,
  usuarioId: string,
): Promise<boolean> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!productoId.trim()) throw new Error('Falta el producto.');
  if (!negocioId.trim()) throw new Error('Falta el negocio del producto.');
  if (!usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  try {
    const { ref, data } = await verificarProductoDelNegocio(productoId, negocioId, usuarioId);
    const actual: boolean = typeof data.disponible === 'boolean' ? data.disponible : true;
    const nuevo: boolean = !actual;
    await updateDoc(ref, { disponible: nuevo });
    invalidarMenu(negocioId);
    return nuevo;
  } catch (e) {
    if (e instanceof Error && errorProductoPassthrough(e)) throw e;
    throw new Error(
      e instanceof Error
        ? `No se pudo actualizar el plato: ${e.message}`
        : 'No se pudo actualizar el plato. Intentá de nuevo.',
    );
  }
}

// Carta diaria: guarda los días de la semana en que el plato aparece
// (0 = domingo). Array vacío = todos los días.
export async function actualizarDiasProducto(
  productoId: string,
  negocioId: string,
  usuarioId: string,
  diasSemana: number[],
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!productoId.trim()) throw new Error('Falta el producto.');
  if (!negocioId.trim()) throw new Error('Falta el negocio del producto.');
  if (!usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  try {
    const { ref } = await verificarProductoDelNegocio(productoId, negocioId, usuarioId);
    const dias: number[] | undefined = normalizarDiasSemana(diasSemana);
    await updateDoc(ref, { diasSemana: dias ?? [] });
    invalidarMenu(negocioId);
  } catch (e) {
    if (e instanceof Error && errorProductoPassthrough(e)) throw e;
    throw new Error(
      e instanceof Error
        ? `No se pudieron actualizar los días: ${e.message}`
        : 'No se pudieron actualizar los días. Intentá de nuevo.',
    );
  }
}

export async function eliminarProducto(
  productoId: string,
  negocioId: string,
  usuarioId: string,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!productoId.trim()) throw new Error('Falta el producto.');
  if (!negocioId.trim()) throw new Error('Falta el negocio del producto.');
  if (!usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  try {
    const { ref } = await verificarProductoDelNegocio(productoId, negocioId, usuarioId);
    await deleteDoc(ref);
    invalidarMenu(negocioId);
  } catch (e) {
    if (e instanceof Error && errorProductoPassthrough(e)) throw e;
    throw new Error(
      e instanceof Error
        ? `No se pudo eliminar el plato: ${e.message}`
        : 'No se pudo eliminar el plato. Intentá de nuevo.',
    );
  }
}

// ---------- F6 Negocio propio: S1 registro + vínculo / S2 Mi local ----------

export interface ActualizarNegocioInput {
  negocioId: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  tiempoEstimado?: string;
  envioGratis?: boolean;
  // Costo de envío en soles (0 = sin costo). Se ignora si envioGratis.
  costoEnvio?: number;
  lat?: number;
  lng?: number;
  // Horario semanal completo (lun-dom). Array vacío = sin horario (siempre
  // abierto salvo override manual). Ausente = no tocar el guardado.
  horario?: HorarioDia[];
  // Categoría (combobox de Mi local): al cambiarla se reescribe `categorias`
  // completo (fuente de filtros y de carta diaria).
  categoria?: CategoriaNegocio;
  // Precios del menú del día (restaurantes): entrada+comida y cada extra.
  precioMenuDia?: number;
  precioExtra?: number;
}

// Chequeo de forma del horario antes de escribirlo (nunca confiar en lo que
// llega del form sin validar).
function esHorarioValido(horario: unknown): boolean {
  return (
    Array.isArray(horario) &&
    horario.every(
      (f) =>
        typeof f === 'object' &&
        f !== null &&
        typeof (f as HorarioDia).dia === 'number' &&
        typeof (f as HorarioDia).apertura === 'string' &&
        typeof (f as HorarioDia).cierre === 'string',
    )
  );
}

export async function actualizarNegocio(
  input: ActualizarNegocioInput,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.negocioId.trim()) throw new Error('Falta el negocio a editar.');
  if (!input.usuarioId.trim())
    throw new Error('Falta el usuario del negocio.');
  if (!input.nombre.trim()) throw new Error('El negocio necesita un nombre.');
  if (
    (input.lat !== undefined && !Number.isFinite(input.lat)) ||
    (input.lng !== undefined && !Number.isFinite(input.lng))
  ) {
    throw new Error('La ubicación del negocio no es válida.');
  }
  if (input.horario !== undefined && !esHorarioValido(input.horario)) {
    throw new Error('El horario de atención no es válido.');
  }
  if (input.categoria !== undefined && !esCategoriaNegocio(input.categoria)) {
    throw new Error('La categoría del negocio no es válida.');
  }
  if (
    (input.precioMenuDia !== undefined && !(input.precioMenuDia > 0)) ||
    (input.precioExtra !== undefined && !(input.precioExtra > 0))
  ) {
    throw new Error('Los precios del menú del día deben ser mayores a 0.');
  }
  if (
    input.costoEnvio !== undefined &&
    (!Number.isFinite(input.costoEnvio) || input.costoEnvio < 0)
  ) {
    throw new Error('El costo de envío no es válido.');
  }
  try {
    const ref = doc(getFirestoreDb(), 'negocios', input.negocioId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('El negocio no existe.');
    const data: unknown = snap.data();
    const duenoId: unknown =
      typeof data === 'object' && data !== null
        ? (data as { duenioId?: unknown }).duenioId
        : undefined;
    // Chequeo de dueño en cliente (S4 lo cierra con rules). Estricto a
    // propósito: los 15 del seed no tienen duenioId, así que nadie los edita.
    if (typeof duenoId !== 'string' || duenoId !== input.usuarioId) {
      throw new Error('Solo el dueño puede editar este negocio.');
    }
    const cambios: {
      [campo: string]: string | boolean | number | HorarioDia[] | CategoriaNegocio[] | CategoriaNegocio;
    } = {
      nombre: input.nombre.trim(),
    };
    if (input.descripcion !== undefined)
      cambios['descripcion'] = input.descripcion.trim();
    if (input.direccion !== undefined)
      cambios['direccion'] = input.direccion.trim();
    if (input.tiempoEstimado !== undefined)
      cambios['tiempoEstimado'] = input.tiempoEstimado.trim();
    if (input.envioGratis !== undefined)
      cambios['envioGratis'] = input.envioGratis;
    if (input.costoEnvio !== undefined)
      cambios['costoEnvio'] = input.costoEnvio;
    if (input.lat !== undefined) cambios['lat'] = input.lat;
    if (input.lng !== undefined) cambios['lng'] = input.lng;
    // horario vacío = borrar franjas (siempre abierto); está permitido.
    if (input.horario !== undefined) cambios['horario'] = input.horario;
    if (input.categoria !== undefined) {
      cambios['categoria'] = input.categoria;
      cambios['categorias'] = [input.categoria];
    }
    if (input.precioMenuDia !== undefined)
      cambios['precioMenuDia'] = input.precioMenuDia;
    if (input.precioExtra !== undefined)
      cambios['precioExtra'] = input.precioExtra;
    await updateDoc(ref, cambios);
    invalidarNegocios();
    // Ubicación modificada → sincroniza la dirección de trabajo del dueño.
    if (
      input.lat !== undefined ||
      input.lng !== undefined ||
      input.direccion !== undefined
    ) {
      const previo: { direccion?: unknown; lat?: unknown; lng?: unknown } =
        typeof data === 'object' && data !== null
          ? (data as { direccion?: unknown; lat?: unknown; lng?: unknown })
          : {};
      await guardarUbicacionTrabajo(input.usuarioId, {
        direccion:
          input.direccion?.trim() ??
          (typeof previo.direccion === 'string' ? previo.direccion : ''),
        lat:
          input.lat ??
          (typeof previo.lat === 'number' ? previo.lat : Number.NaN),
        lng:
          input.lng ??
          (typeof previo.lng === 'number' ? previo.lng : Number.NaN),
      });
    }
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El negocio no existe.' ||
        e.message === 'Solo el dueño puede editar este negocio.')
    ) {
      throw e;
    }
    throw new Error(
      e instanceof Error
        ? `No se pudo actualizar el negocio: ${e.message}`
        : 'No se pudo actualizar el negocio. Intentá de nuevo.',
    );
  }
}

// Abrir/cerrar manual del dueño, guardado en negocios/{id}.abiertoManual.
// El efectivo se sigue derivando con estaAbierto(). Requiere sesión del dueño.
export async function cambiarAbiertoNegocio(
  negocioId: string,
  usuarioId: string,
  abierto: boolean,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!negocioId.trim()) throw new Error('Falta el negocio a editar.');
  try {
    await verificarDuenoNegocio(negocioId, usuarioId);
    await updateDoc(doc(getFirestoreDb(), 'negocios', negocioId), {
      abiertoManual: abierto,
    });
    invalidarNegocios();
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo cambiar el estado: ${e.message}`
        : 'No se pudo cambiar el estado del negocio.',
    );
  }
}

// ---------- Repartidores del negocio ----------

const TELEFONO_REGEX = /^[0-9+\s-]{6,15}$/;

function esEstadoRepartidor(v: unknown): v is EstadoRepartidor {
  return v === 'en_ruta' || v === 'disponible' || v === 'descanso';
}

function isRepartidor(v: unknown): v is Repartidor {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Partial<Repartidor>;
  return (
    typeof r.id === 'string' &&
    typeof r.negocioId === 'string' &&
    typeof r.nombre === 'string' &&
    esEstadoRepartidor(r.estado) &&
    typeof r.entregasHoy === 'number'
  );
}

export interface CrearRepartidorInput {
  negocioId: string;
  usuarioId: string;
  nombre: string;
  telefono?: string;
}

export async function crearRepartidor(input: CrearRepartidorInput): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  const nombre: string = input.nombre.trim();
  if (nombre.length < 3) throw new Error('El nombre del repartidor necesita al menos 3 caracteres.');
  const telefono: string = input.telefono?.trim() ?? '';
  if (telefono && !TELEFONO_REGEX.test(telefono)) {
    throw new Error('El teléfono no es válido (ej. 999 888 777).');
  }
  try {
    await verificarDuenoNegocio(input.negocioId, input.usuarioId);
    const ref = await addDoc(collection(getFirestoreDb(), 'repartidores'), {
      negocioId: input.negocioId,
      nombre,
      estado: 'disponible',
      entregasHoy: 0,
      ...(telefono ? { telefono } : {}),
    });
    return ref.id;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo crear el repartidor: ${e.message}`
        : 'No se pudo crear el repartidor. Intentá de nuevo.',
    );
  }
}

// Listener en vivo de los repartidores del negocio (misma forma que
// escucharPedidosNegocio: sin orderBy para no exigir índice compuesto).
export function escucharRepartidores(
  negocioId: string,
  cb: (repartidores: Repartidor[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!firebaseReady) return () => {};
  if (!negocioId.trim()) return () => {};
  try {
    const q = query(
      collection(getFirestoreDb(), 'repartidores'),
      where('negocioId', '==', negocioId),
    );
    return onSnapshot(
      q,
      (snap) => {
        try {
          const data: unknown = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const lista: Repartidor[] = Array.isArray(data)
            ? data.filter(isRepartidor).sort((a, b) => a.nombre.localeCompare(b.nombre))
            : [];
          cb(lista);
        } catch (e) {
          onError?.(
            e instanceof Error
              ? e
              : new Error('No se pudieron leer los repartidores del negocio.'),
          );
        }
      },
      (err: Error) => {
        onError?.(
          err instanceof Error
            ? err
            : new Error('Se perdió la conexión con los repartidores.'),
        );
      },
    );
  } catch (e) {
    onError?.(
      e instanceof Error
        ? e
        : new Error('No se pudo escuchar los repartidores del negocio.'),
    );
    return () => {};
  }
}

export async function cambiarEstadoRepartidor(
  repartidorId: string,
  negocioId: string,
  usuarioId: string,
  estado: EstadoRepartidor,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!repartidorId.trim()) throw new Error('Falta el repartidor.');
  if (!esEstadoRepartidor(estado)) throw new Error('El estado del repartidor no es válido.');
  try {
    await verificarDuenoNegocio(negocioId, usuarioId);
    const ref = doc(getFirestoreDb(), 'repartidores', repartidorId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('El repartidor no existe.');
    if (snap.data().negocioId !== negocioId) {
      throw new Error('El repartidor no pertenece a este negocio.');
    }
    await updateDoc(ref, { estado });
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo cambiar el estado: ${e.message}`
        : 'No se pudo cambiar el estado del repartidor.',
    );
  }
}

export async function eliminarRepartidor(
  repartidorId: string,
  negocioId: string,
  usuarioId: string,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!repartidorId.trim()) throw new Error('Falta el repartidor.');
  try {
    await verificarDuenoNegocio(negocioId, usuarioId);
    const ref = doc(getFirestoreDb(), 'repartidores', repartidorId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('El repartidor no existe.');
    if (snap.data().negocioId !== negocioId) {
      throw new Error('El repartidor no pertenece a este negocio.');
    }
    await deleteDoc(ref);
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo eliminar el repartidor: ${e.message}`
        : 'No se pudo eliminar el repartidor.',
    );
  }
}

export interface RegistrarNegocioInput {
  usuarioId: string;
  nombre: string;
  categoria: CategoriaNegocio;
  descripcion?: string;
  direccion?: string;
  lat: number;
  lng: number;
}

export async function registrarNegocio(
  input: RegistrarNegocioInput,
): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  if (!input.nombre.trim()) throw new Error('El negocio necesita un nombre.');
  if (!esCategoriaNegocio(input.categoria)) {
    throw new Error('La categoría del negocio no es válida.');
  }
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new Error('La ubicación del negocio no es válida.');
  }
  let negocioId: string;
  try {
    const ref = await addDoc(collection(getFirestoreDb(), 'negocios'), {
      nombre: input.nombre.trim(),
      categoria: input.categoria,
      categorias: [input.categoria],
      descripcion: input.descripcion?.trim() ?? '',
      direccion: input.direccion?.trim() ?? '',
      imagen: '',
      rating: 0,
      opiniones: 0,
      tiempoEstimado: '',
      distancia: '',
      envioGratis: false,
      costoEnvio: 0,
      lat: input.lat,
      lng: input.lng,
      duenioId: input.usuarioId,
    });
    negocioId = ref.id;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo registrar el negocio: ${e.message}`
        : 'No se pudo registrar el negocio. Intentá de nuevo.',
    );
  }
  try {
    await setDoc(
      doc(getFirestoreDb(), 'users', input.usuarioId),
      { rol: 'negocio', negocioId },
      { merge: true },
    );
  } catch (e) {
    const detalle: string =
      e instanceof Error ? e.message : 'error desconocido';
    throw new Error(
      `El negocio se creó (id ${negocioId}) pero no se pudo vincular a tu cuenta: ${detalle}. Pedí al equipo que en users/${input.usuarioId} ponga negocioId:'${negocioId}' y rol:'negocio'.`,
    );
  }
  // Dirección de trabajo del dueño = la del negocio recién creado.
  await guardarUbicacionTrabajo(input.usuarioId, {
    direccion: input.direccion?.trim() ?? '',
    lat: input.lat,
    lng: input.lng,
  });
  invalidarNegocios();
  return negocioId;
}

// ---------- F6 Negocio propio: S3 icono + portada con Storage ----------

export type TipoFotoNegocio = 'icono' | 'portada';

export async function subirFotoNegocio(
  negocioId: string,
  usuarioId: string,
  uriLocal: string,
  tipo: TipoFotoNegocio,
): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!negocioId.trim()) throw new Error('Falta el negocio de la foto.');
  if (!usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  if (!uriLocal.trim()) throw new Error('Falta la foto a subir.');
  try {
    const refDoc = doc(getFirestoreDb(), 'negocios', negocioId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) throw new Error('El negocio no existe.');
    const data: unknown = snap.data();
    const duenoId: unknown =
      typeof data === 'object' && data !== null
        ? (data as { duenioId?: unknown }).duenioId
        : undefined;
    // Dueño estricto, igual que actualizarNegocio (S4 lo cierra con rules).
    if (typeof duenoId !== 'string' || duenoId !== usuarioId) {
      throw new Error('Solo el dueño puede cambiar las fotos de este negocio.');
    }
    const url: string = await subirImagenCloudinary(uriLocal, negocioId);
    await updateDoc(refDoc, tipo === 'icono' ? { imagen: url } : { portada: url });
    invalidarNegocios();
    return url;
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message === 'El negocio no existe.' ||
        e.message === 'Solo el dueño puede cambiar las fotos de este negocio.' ||
        e.message === 'No se pudo leer la foto elegida. Probá con otra imagen.')
    ) {
      throw e;
    }
    if (e instanceof Error) throw e;
    throw new Error('No se pudo subir la foto. Intentá de nuevo.');
  }
}

async function subirImagenCloudinary(uriLocal: string, folder: string): Promise<string> {
  const cloud: string = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD?.trim() ?? '';
  const preset: string = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET?.trim() ?? '';
  if (!cloud || !preset) {
    throw new Error(
      'Falta configurar Cloudinary: poné EXPO_PUBLIC_CLOUDINARY_CLOUD y EXPO_PUBLIC_CLOUDINARY_PRESET en tu .env (ver .env.example).',
    );
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('No se pudo leer la foto elegida.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uriLocal, true);
    xhr.send(null);
  }).catch(() => {
    throw new Error('No se pudo leer la foto elegida. Probá con otra imagen.');
  });
  const dataUrl: string = await new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error('No se pudo procesar la foto.'));
    lector.readAsDataURL(blob);
  }).catch(() => {
    throw new Error('No se pudo procesar la foto. Probá con otra imagen.');
  });
  const form = new FormData();
  form.append('file', dataUrl);
  form.append('upload_preset', preset);
  form.append('folder', `barriogo/${folder}`);
  try {
    const subida = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!subida.ok) {
      const cuerpo: string = await subida.text().catch(() => '');
      throw new Error(`Cloudinary HTTP ${subida.status}: ${cuerpo.slice(0, 200) || 'sin detalle'}`);
    }
    const json: unknown = await subida.json();
    const segura: unknown =
      typeof json === 'object' && json !== null
        ? (json as { secure_url?: unknown }).secure_url
        : undefined;
    if (typeof segura !== 'string' || !segura) {
      throw new Error('Cloudinary no devolvió la URL de la foto.');
    }
    return segura;
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.startsWith('Cloudinary HTTP') ||
        e.message === 'Cloudinary no devolvió la URL de la foto.')
    ) {
      throw e;
    }
    const causa: string = e instanceof Error && e.message ? ` Causa: ${e.message.slice(0, 200)}` : '';
    throw new Error(`No se pudo subir la foto a Cloudinary. Revisá tu conexión.${causa}`);
  }
}

export async function subirFotoProducto(
  negocioId: string,
  usuarioId: string,
  uriLocal: string,
): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!negocioId.trim()) throw new Error('Falta el negocio de la foto.');
  if (!uriLocal.trim()) throw new Error('Falta la foto a subir.');
  await verificarDuenoNegocio(negocioId, usuarioId);
  return subirImagenCloudinary(uriLocal, `productos/${negocioId}`);
}

// Foto de perfil del cliente: sube a Cloudinary y la guarda en
// users/{uid}.fotoUrl (merge). Solo el propio usuario puede cambiarla.
export async function subirFotoUsuario(
  usuarioId: string,
  uriLocal: string,
): Promise<string> {
  validateUsuarioId(usuarioId);
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!uriLocal.trim()) throw new Error('Falta la foto a subir.');
  const url: string = await subirImagenCloudinary(uriLocal, `usuarios/${usuarioId}`);
  const local = await storage.loadUserProfile(usuarioId);
  const perfil: PerfilUsuario = {
    telefono: local?.telefono ?? '',
    fotoUrl: url,
  };
  await storage.saveUserProfile(usuarioId, perfil);
  try {
    await setDoc(
      doc(getFirestoreDb(), 'users', usuarioId),
      { fotoUrl: url },
      { merge: true },
    );
  } catch {
    // Reglas viejas: la foto queda solo local hasta publicar reglas nuevas.
  }
  return url;
}

// ---------- F5: opiniones de clientes (rating persistido) ----------

export interface CrearOpinionInput {
  negocioId: string;
  usuarioId: string;
  nombre: string;
  estrellas: number;
  texto: string;
  // Misma fecha que la entrada optimista del contexto: así el dedupe
  // (usuarioId|fecha|texto) evita mostrarla dos veces.
  fecha: string;
}

function isOpinion(value: unknown): value is Opinion {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Partial<Opinion>;
  return (
    typeof o.id === 'string' &&
    typeof o.negocioId === 'string' &&
    typeof o.usuarioId === 'string' &&
    typeof o.nombre === 'string' &&
    esEstrellas(o.estrellas) &&
    typeof o.texto === 'string' &&
    o.texto.length > 0 &&
    o.texto.length <= MAX_TEXTO_OPINION &&
    typeof o.fecha === 'string'
  );
}

export async function crearOpinion(input: CrearOpinionInput): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.negocioId.trim()) throw new Error('Falta el negocio de la opinión.');
  if (!input.usuarioId.trim()) throw new Error('Iniciá sesión para publicar una opinión.');
  const nombre: string = input.nombre.trim();
  if (!nombre) throw new Error('Tu nombre es necesario para publicar.');
  if (!esEstrellas(input.estrellas)) {
    throw new Error('La valoración debe ser de 1 a 5 estrellas.');
  }
  const texto: string = input.texto.trim();
  if (texto.length < 1) throw new Error('La opinión necesita un texto.');
  if (texto.length > MAX_TEXTO_OPINION) {
    throw new Error(`La opinión puede tener hasta ${MAX_TEXTO_OPINION} caracteres.`);
  }
  const fecha: string = input.fecha.trim();
  if (!fecha || Number.isNaN(Date.parse(fecha))) {
    throw new Error('La fecha de la opinión no es válida.');
  }
  try {
    const ref = await addDoc(collection(getFirestoreDb(), 'opiniones'), {
      negocioId: input.negocioId.trim(),
      usuarioId: input.usuarioId.trim(),
      nombre,
      estrellas: input.estrellas,
      texto,
      fecha,
    });
    return ref.id;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo publicar la opinión: ${e.message}`
        : 'No se pudo publicar la opinión. Intentá de nuevo.',
    );
  }
}

// Todas las opiniones (el rating de Inicio las necesita de todos).
// Si un día la colección crece, pasar a un listener por negocioId.
export function escucharOpiniones(
  cb: (opiniones: Opinion[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!firebaseReady) return () => {};
  try {
    return onSnapshot(
      collection(getFirestoreDb(), 'opiniones'),
      (snap) => {
        const lista: Opinion[] = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(isOpinion)
          .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
        cb(lista);
      },
      (err: unknown) => {
        onError?.(
          err instanceof Error ? err : new Error('No se pudieron leer las opiniones.'),
        );
      },
    );
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error('No se pudo escuchar las opiniones.'));
    return () => {};
  }
}
