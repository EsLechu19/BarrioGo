import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ItemPedido } from '../types/Pedido';
import { Producto } from '../types/Producto';
import { storage } from '../services/storage';
import { productosMock } from '../data/productosMock';

interface CartContextValue {
  items: ItemPedido[];
  count: number;
  total: number;
  add: (producto: Producto, cantidad?: number) => boolean;
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
      if (saved) {
        // Migra carritos viejos (APF2): lo de Firestore queda sin negocioId
        // y no se puede confirmar hasta agregarlo de nuevo desde su menú.
        const migrados: ItemPedido[] = saved.map((item) => {
          if (item.negocioId) return item;
          const producto = productosMock.find((p) => p.id === item.productoId);
          if (!producto) return item;
          const base: ItemPedido = { ...item, negocioId: producto.negocioId };
          const descripcionMigrada: string =
            item.descripcion?.trim() || producto.descripcion?.trim() || '';
          const imagenMigrada: string =
            item.imagen?.trim() || producto.imagen?.trim() || '';
          // Firestore rechaza undefined: solo dejamos la clave si hay valor.
          if (descripcionMigrada) base.descripcion = descripcionMigrada;
          else delete base.descripcion;
          if (imagenMigrada) base.imagen = imagenMigrada;
          else delete base.imagen;
          return base;
        });
        setItems(migrados);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) storage.saveCart(items);
  }, [items, hydrated]);

  // Carrito multinegocio (Fase 2): acepta productos de varios negocios;
  // al confirmar, se crea un pedido por cada negocio.
  const add = useCallback((producto: Producto, cantidad = 1): boolean => {
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
        {
          productoId: producto.id,
          cantidad,
          precioUnitario: producto.precio,
          negocioId: producto.negocioId,
          nombre: producto.nombre,
          // Firestore rechaza undefined: solo agregamos la clave si hay valor
          // (producto sin foto/descripción no debe arrastrar el campo vacío).
          ...(producto.descripcion?.trim()
            ? { descripcion: producto.descripcion }
            : {}),
          ...(producto.imagen?.trim() ? { imagen: producto.imagen } : {}),
        },
      ];
    });
    return true;
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
    () => ({
      items,
      count,
      total,
      add,
      remove,
      setCantidad,
      clear,
      cantidadDe,
    }),
    [items, count, total, add, remove, setCantidad, clear, cantidadDe],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
