import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DireccionEntrega, MetodoPago } from '../types/Checkout';
import { storage } from '../services/storage';

interface CheckoutContextValue {
  selectedAddress: DireccionEntrega | null;
  selectedPaymentMethod: MetodoPago | null;
  setSelectedAddress: (address: DireccionEntrega) => void;
  setSelectedPaymentMethod: (method: MetodoPago) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddressState] = useState<DireccionEntrega | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethodState] = useState<MetodoPago | null>(null);

  useEffect(() => {
    let mounted = true;
    void storage.loadCheckout().then((selection) => {
      if (!mounted) return;
      setSelectedAddressState(selection?.direccionEntrega ?? null);
      setSelectedPaymentMethodState(selection?.metodoPago ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  function setSelectedAddress(address: DireccionEntrega): void {
    setSelectedAddressState(address);
    void storage.saveCheckoutAddress(address);
  }

  function setSelectedPaymentMethod(method: MetodoPago): void {
    setSelectedPaymentMethodState(method);
    void storage.saveCheckoutPaymentMethod(method);
  }

  return (
    <CheckoutContext.Provider value={{ selectedAddress, selectedPaymentMethod, setSelectedAddress, setSelectedPaymentMethod }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error('useCheckout debe usarse dentro de CheckoutProvider.');
  return context;
}
