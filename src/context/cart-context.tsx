"use client";

import {
  createContext,
  ReactNode,
  useEffect,
  useContext,
  useMemo,
  useState,
} from "react";
import { CartItem } from "@/types/product";

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  recentAdd: CartItem | null;
  dismissRecentAdd: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [recentAdd, setRecentAdd] = useState<CartItem | null>(null);

  useEffect(() => {
    const raw =
      window.localStorage.getItem("streetvault-cart-v3") ??
      window.localStorage.getItem("qadir-cart-v2");
    if (raw) {
      try {
        setItems(
          (JSON.parse(raw) as CartItem[]).map((item) => ({
            ...item,
            shippingRateAUD: item.shippingRateAUD ?? 0,
          }))
        );
      } catch {
        setItems([]);
      }
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("streetvault-cart-v3", JSON.stringify(items));
  }, [items, storageReady]);

  const addItem = (incomingItem: CartItem) => {
    setRecentAdd(incomingItem);
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.variantId === incomingItem.variantId
      );

      if (existingIndex >= 0) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + incomingItem.quantity,
        };
        return updated;
      }

      return [...currentItems, incomingItem];
    });
  };

  const addItems = (incomingItems: CartItem[]) => {
    incomingItems.forEach(addItem);
  };

  const removeItem = (variantId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.variantId !== variantId)
    );
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(variantId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);
  const dismissRecentAdd = () => setRecentAdd(null);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = {
    items,
    addItem,
    addItems,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    recentAdd,
    dismissRecentAdd,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
