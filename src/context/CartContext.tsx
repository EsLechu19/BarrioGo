import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ItemPedido } from '../types/Pedido';
import { Producto } from '../types/Producto';
import { storage } from '../services/storage';

interface CartContextValue {
  items: ItemPedido[];
  count: number;
  total: number;
  add: (producto: Producto, cantidad?: number) => void;
  remove: (productoId: string) => void;
  setCantidad: (productoId: string, cantidad: number) => void;
  clear: () => void;
  cantidadDe: (productoId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    storage.loadCart().then((saved) => {
      if (saved) setItems(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) storage.saveCart(items);
  }, [items, hydrated]);

  const add = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productoId === producto.id);
      if (found) {
        return prev.map((i) =>
          i.productoId === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i,
        );
      }
      return [
        ...prev,
        { productoId: producto.id, cantidad, precioUnitario: producto.precio },
      ];
    });
  }, []);

  const remove = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const setCantidad = useCallback((productoId: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.productoId !== productoId)
        : prev.map((i) =>
            i.productoId === productoId ? { ...i, cantidad } : i,
          ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const cantidadDe = useCallback(
    (productoId: string) =>
      items.find((i) => i.productoId === productoId)?.cantidad ?? 0,
    [items],
  );

  const { count, total } = useMemo(() => {
    return items.reduce(
      (acc, i) => ({
        count: acc.count + i.cantidad,
        total: acc.total + i.cantidad * i.precioUnitario,
      }),
      { count: 0, total: 0 },
    );
  }, [items]);

  const value = useMemo(
    () => ({ items, count, total, add, remove, setCantidad, clear, cantidadDe }),
    [items, count, total, add, remove, setCantidad, clear, cantidadDe],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
