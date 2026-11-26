import { db } from '../config/firebase.js';
import type { PedidoData, ValidatedOrders } from '../types/payment.js';

export function cents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function validatePendingOrders(uid: string, pedidoIds: unknown): Promise<ValidatedOrders> {
  if (!Array.isArray(pedidoIds) || pedidoIds.length < 1 || pedidoIds.length > 20) {
    throw new Error('Select between 1 and 20 orders.');
  }
  const ids = [...new Set(pedidoIds as string[])];
  if (ids.length !== pedidoIds.length || ids.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,150}$/.test(id))) {
    throw new Error('Invalid order identifiers.');
  }
  const refs = ids.map((id) => db.collection('pedidos').doc(id));
  const snapshots = await db.getAll(...refs);
  let totalCents = 0;
  const mpItems: ValidatedOrders['mpItems'] = [];

  for (const snap of snapshots) {
    if (!snap.exists) throw new Error('An order was not found.');
    const data = snap.data() as PedidoData;
    if (data.usuarioId !== uid || data.estado !== 'pendiente' || data.estadoPago !== 'pendiente') {
      throw new Error('All orders must belong to you and still be pending.');
    }
    if (data.metodoPago?.tipo !== 'mercadopago_sandbox') {
      throw new Error('Orders must use Mercado Pago sandbox.');
    }
    if (!Array.isArray(data.items) || !data.items.length) throw new Error('An order has no items.');
    const businessSnap = await db.collection('negocios').doc(data.negocioId).get();
    if (!businessSnap.exists) throw new Error('A business for this order was not found.');
    const business = businessSnap.data() ?? {};
    let businessCents = 0;

    for (const item of data.items) {
      if (!item || !text(item.productoId) || !Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 100) {
        throw new Error('An order contains an invalid item.');
      }
      const productSnap = await db.collection('productos').doc(item.productoId).get();
      if (!productSnap.exists) throw new Error('A product for this order was not found.');
      const product = productSnap.data() ?? {};
      const productPrice = cents(product.precio);
      if (product.negocioId !== data.negocioId || productPrice === null || productPrice <= 0) {
        throw new Error('A product does not match its business or current price.');
      }
      const reportedCents = cents(item.precioUnitario);
      if (reportedCents !== productPrice) throw new Error('A product price changed; please recreate the order.');
      businessCents += productPrice * item.cantidad;
      mpItems.push({
        title: text(product.nombre) ?? 'BarrioGo item',
        quantity: item.cantidad,
        unit_price: (productPrice / 100).toFixed(2),
      });
    }

    const freeDelivery = business.envioGratis === true;
    const shippingCents = freeDelivery ? 0 : (cents(business.costoEnvio ?? 0) ?? -1);
    const storedShipping = cents(data.envio ?? 0);
    if (shippingCents < 0 || storedShipping !== shippingCents) {
      throw new Error('A delivery fee changed; please recreate the order.');
    }
    if (shippingCents > 0) {
      mpItems.push({ title: `Delivery - ${text(business.nombre) ?? 'Business'}`, quantity: 1, unit_price: (shippingCents / 100).toFixed(2) });
    }
    const orderCents = cents(data.total);
    if (orderCents === null || orderCents !== businessCents + shippingCents) {
      throw new Error('An order total does not match the current catalog.');
    }
    totalCents += orderCents;
  }
  if (totalCents <= 0 || totalCents > 999_999_999) throw new Error('The payment amount is invalid.');
  return { ids, totalCents, mpItems };
}
