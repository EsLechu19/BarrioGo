import { storage } from '../services/storage';
import type { DireccionPedido } from '../types/Pedido';
import type { DireccionUsuario } from '../types/Direccion';

// Semilla de diseño: se guarda la primera vez que un usuario entra a
// Direcciones y todavía no tiene nada en storage, para que el profe vea el
// mismo listado que en el mock viejo. Nunca pisa direcciones reales.
export const DIRECCIONES_SEMILLA: DireccionUsuario[] = [
  { id: 'd1', alias: 'Casa', detalle: 'Av. Mi casa 123, Lima', esPrincipal: true },
  { id: 'd2', alias: 'Trabajo', detalle: 'Av. Arequipa 2450, Lima', esPrincipal: false },
];

// Lista del usuario; si nunca se guardó, siembra la de diseño y la persiste.
export async function cargarDirecciones(usuarioId: string): Promise<DireccionUsuario[]> {
  const guardadas = await storage.loadAddresses(usuarioId);
  if (guardadas !== null) return guardadas;
  await storage.saveAddresses(usuarioId, DIRECCIONES_SEMILLA);
  return DIRECCIONES_SEMILLA;
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
