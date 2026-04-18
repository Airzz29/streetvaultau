"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  removeBundle: (bundleId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  recentAdd: CartItem | null;
  dismissRecentAdd: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = "streetvault-cart-guest-v1";
const LEGACY_CART_KEYS = ["streetvault-cart-v3", "qadir-cart-v2"];

function getCartMergeKey(item: CartItem) {
  return item.bundleId ? `${item.bundleId}::${item.variantId}` : item.variantId;
}

function normalizeItems(items: CartItem[]) {
  return items
    .filter((item) => item.variantId && item.productId && item.quantity > 0)
    .map((item) => ({
      ...item,
      quantity: Math.min(99, Math.max(1, Math.floor(item.quantity))),
      shippingRateAUD: item.shippingRateAUD ?? 0,
    }));
}

function loadGuestCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  const direct = window.localStorage.getItem(GUEST_CART_KEY);
  if (direct) {
    try {
      return normalizeItems(JSON.parse(direct) as CartItem[]);
    } catch {
      // fall through
    }
  }
  for (const key of LEGACY_CART_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = normalizeItems(JSON.parse(raw) as CartItem[]);
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(parsed));
      LEGACY_CART_KEYS.forEach((k) => window.localStorage.removeItem(k));
      return parsed;
    } catch {
      continue;
    }
  }
  return [];
}

function persistGuestCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(normalizeItems(items)));
    LEGACY_CART_KEYS.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const sessionUserIdRef = useRef<string | null>(null);
  const prevUserRef = useRef<string | null>(null);
  const skipNextPut = useRef(false);
  const [recentAdd, setRecentAdd] = useState<CartItem | null>(null);

  useEffect(() => {
    sessionUserIdRef.current = sessionUserId;
  }, [sessionUserId]);

  const bootstrapCart = useCallback(async () => {
    try {
      const meResponse = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      const meData = (await meResponse.json()) as { user?: { id: string } | null };
      const uid = meData.user?.id ?? null;
      const prev = prevUserRef.current;
      prevUserRef.current = uid;

      if (prev !== null && uid === null) {
        skipNextPut.current = true;
        const guest = loadGuestCartFromStorage();
        setItems(guest);
        setSessionUserId(null);
        sessionUserIdRef.current = null;
        setBootstrapped(true);
        return;
      }

      if (uid) {
        skipNextPut.current = true;
        const cartResponse = await fetch("/api/account/cart", { cache: "no-store", credentials: "include" });
        if (!cartResponse.ok) {
          setItems([]);
          setSessionUserId(uid);
          sessionUserIdRef.current = uid;
          setBootstrapped(true);
          return;
        }
        const cartData = (await cartResponse.json()) as { items?: CartItem[] };
        const serverItems = normalizeItems(cartData.items ?? []);
        setItems(serverItems);
        setSessionUserId(uid);
        sessionUserIdRef.current = uid;
        LEGACY_CART_KEYS.forEach((k) => {
          try {
            window.localStorage.removeItem(k);
          } catch {
            // ignore
          }
        });
        await fetch("/api/account/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ items: serverItems }),
        }).catch(() => {
          // non-blocking
        });
        setBootstrapped(true);
        return;
      }

      LEGACY_CART_KEYS.forEach((k) => {
        try {
          const legacy = window.localStorage.getItem(k);
          if (legacy && !window.localStorage.getItem(GUEST_CART_KEY)) {
            window.localStorage.setItem(GUEST_CART_KEY, legacy);
          }
          window.localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
      setItems(loadGuestCartFromStorage());
      setSessionUserId(null);
      sessionUserIdRef.current = null;
      setBootstrapped(true);
    } catch {
      setItems(loadGuestCartFromStorage());
      setSessionUserId(null);
      sessionUserIdRef.current = null;
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => {
    void bootstrapCart();
  }, [bootstrapCart]);

  useEffect(() => {
    const onFocus = () => {
      void fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
        .then((r) => r.json())
        .then((data: { user?: { id: string } | null }) => {
          const uid = data.user?.id ?? null;
          if (uid !== sessionUserIdRef.current) {
            window.location.reload();
          }
        })
        .catch(() => {
          // ignore
        });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!bootstrapped || sessionUserId) return;
    persistGuestCart(items);
  }, [items, bootstrapped, sessionUserId]);

  useEffect(() => {
    if (!bootstrapped || !sessionUserId) return;
    if (skipNextPut.current) {
      skipNextPut.current = false;
      return;
    }
    const timer = globalThis.setTimeout(() => {
      fetch("/api/account/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: normalizeItems(items) }),
      }).catch(() => {
        // non-blocking
      });
    }, 180);
    return () => globalThis.clearTimeout(timer);
  }, [bootstrapped, sessionUserId, items]);

  const addItem = (incomingItem: CartItem) => {
    setRecentAdd(incomingItem);
    setItems((currentItems) => {
      const incomingKey = getCartMergeKey(incomingItem);
      const existingIndex = currentItems.findIndex((item) => getCartMergeKey(item) === incomingKey);

      if (existingIndex >= 0) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(
            99,
            updated[existingIndex].quantity + incomingItem.quantity
          ),
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
    setItems((currentItems) => currentItems.filter((item) => item.variantId !== variantId));
  };

  const removeBundle = (bundleId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.bundleId !== bundleId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(variantId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.variantId === variantId ? { ...item, quantity: Math.min(99, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    if (sessionUserId) {
      fetch("/api/account/cart", { method: "DELETE", credentials: "include" }).catch(() => {
        // ignore
      });
    } else {
      persistGuestCart([]);
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
    removeBundle,
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
