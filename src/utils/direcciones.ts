import { storage } from '../services/storage';
import type { DireccionPedido } from '../types/Pedido';
import type { DireccionUsuario } from '../types/Direccion';

// Direcciones demo que sembraban versiones viejas de la app. Ya no se
// siembran: existen solo para limpiar instalaciones viejas.
const DIRECCIONES_DEMO: { alias: string; detalle: string }[] = [
  { alias: 'Casa', detalle: 'Av. Mi casa 123, Lima' },
  { alias: 'Trabajo', detalle: 'Av. Arequipa 2450, Lima' },
];

export function esDireccionDemo(direccion: {
  alias: string;
  detalle: string;
}): boolean {
  const alias: string = direccion.alias.trim().toLowerCase();
  const detalle: string = direccion.detalle.trim().toLowerCase();
  return DIRECCIONES_DEMO.some(
    (demo) =>
      demo.alias.toLowerCase() === alias && demo.detalle.toLowerCase() === detalle,
  );
}

// Lista del usuario: nunca siembra datos (sin nada devuelve []). Además
// limpia las direcciones demo de versiones anteriores.
export async function cargarDirecciones(usuarioId: string): Promise<DireccionUsuario[]> {
  const guardadas = await storage.loadAddresses(usuarioId);
  if (guardadas === null) return [];
  const limpias: DireccionUsuario[] = guardadas.filter((d) => !esDireccionDemo(d));
  if (limpias.length !== guardadas.length) {
    await storage.saveAddresses(usuarioId, limpias);
    await limpiarCheckoutDemo(usuarioId);
  }
  return limpias;
}

// Dirección activa del checkout, validada contra las direcciones demo.
// null = no hay (o era una demo, que se limpia del storage).
export async function cargarDireccionCheckout(
  usuarioId: string,
): Promise<DireccionPedido | null> {
  const activa = await storage.loadCheckoutAddress(usuarioId);
  if (activa && esDireccionDemo(activa)) {
    await storage.clearCheckoutAddress(usuarioId);
    return null;
  }
  return activa;
}

async function limpiarCheckoutDemo(usuarioId: string): Promise<void> {
  const activa = await storage.loadCheckoutAddress(usuarioId);
  if (activa && esDireccionDemo(activa)) {
    await storage.clearCheckoutAddress(usuarioId);
  }
}

// Id de la dirección activa del checkout, o null si no hay (o no está en la
// lista). Se compara por alias+detalle porque es lo que persiste el checkout.
export function direccionSeleccionadaId(
  direcciones: DireccionUsuario[],
  activa: DireccionPedido | null,
): string | null {
  if (!activa) return null;
  const encontrada = direcciones.find(
    (d) => d.alias === activa.alias && d.detalle === activa.detalle,
  );
  return encontrada?.id ?? null;
}

// La dirección activa, como la espera CarritoScreen / el checkout.
export function aDireccionPedido(direccion: DireccionUsuario): DireccionPedido {
  return { alias: direccion.alias, detalle: direccion.detalle };
}
