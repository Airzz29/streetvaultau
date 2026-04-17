"use client";

import {
  createContext,
  ReactNode,
  useEffect,
  useContext,
  useMemo,
  useRef,
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

function normalizeItems(items: CartItem[]) {
  return items
    .filter((item) => item.variantId && item.productId && item.quantity > 0)
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity)),
      shippingRateAUD: item.shippingRateAUD ?? 0,
    }));
}

function mergeCartItems(localItems: CartItem[], accountItems: CartItem[]) {
  const merged = new Map<string, CartItem>();
  for (const item of [...accountItems, ...localItems]) {
    const existing = merged.get(item.variantId);
    if (!existing) {
      merged.set(item.variantId, { ...item });
      continue;
    }
    merged.set(item.variantId, {
      ...existing,
      quantity: existing.quantity + item.quantity,
    });
  }
  return Array.from(merged.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [recentAdd, setRecentAdd] = useState<CartItem | null>(null);
  const [accountSyncReady, setAccountSyncReady] = useState(false);
  const [accountUserId, setAccountUserId] = useState<string | null>(null);
  const skipNextSync = useRef(false);
  const localItemsAtBootRef = useRef<CartItem[]>([]);

  useEffect(() => {
    const raw =
      window.localStorage.getItem("streetvault-cart-v3") ??
      window.localStorage.getItem("qadir-cart-v2");
    if (raw) {
      try {
        const parsed = (JSON.parse(raw) as CartItem[]).map((item) => ({
          ...item,
          shippingRateAUD: item.shippingRateAUD ?? 0,
        }));
        localItemsAtBootRef.current = parsed;
        setItems(parsed);
      } catch {
        localItemsAtBootRef.current = [];
        setItems([]);
      }
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("streetvault-cart-v3", JSON.stringify(items));
  }, [items, storageReady]);

  useEffect(() => {
    let active = true;
    const loadAccountCart = async () => {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const meData = (await meResponse.json()) as { user?: { id: string } | null };
        const userId = meData.user?.id ?? null;
        if (!active) return;
        setAccountUserId(userId);
        if (!userId) {
          setAccountSyncReady(true);
          return;
        }
        const cartResponse = await fetch("/api/account/cart", { cache: "no-store" });
        if (!cartResponse.ok) {
          setAccountSyncReady(true);
          return;
        }
        const cartData = (await cartResponse.json()) as { items?: CartItem[] };
        if (!active) return;
        const merged = normalizeItems(
          mergeCartItems(localItemsAtBootRef.current, cartData.items ?? [])
        );
        skipNextSync.current = true;
        setItems(merged);
        await fetch("/api/account/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: merged }),
        });
      } catch {
        // Keep local cart experience even if account sync fails.
      } finally {
        if (active) {
          setAccountSyncReady(true);
        }
      }
    };
    if (storageReady) {
      loadAccountCart();
    }
    return () => {
      active = false;
    };
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !accountSyncReady || !accountUserId) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    const timer = globalThis.setTimeout(() => {
      fetch("/api/account/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: normalizeItems(items) }),
      }).catch(() => {
        // Non-blocking: local cart still works.
      });
    }, 180);
    return () => globalThis.clearTimeout(timer);
  }, [accountSyncReady, accountUserId, items, storageReady]);

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

      return [...currentItems, { ...incomingItem, shippingRateAUD: incomingItem.shippingRateAUD ?? 0 }];
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

  const clearCart = () => {
    setItems([]);
    if (accountUserId) {
      fetch("/api/account/cart", { method: "DELETE" }).catch(() => {
        // Keep local clear even if API is unavailable.
      });
    }
  };
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
