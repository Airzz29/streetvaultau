"use client";

import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

type SuccessCartClearerProps = {
  shouldClear: boolean;
  sessionId?: string;
};

export function SuccessCartClearer({ shouldClear, sessionId }: SuccessCartClearerProps) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (!shouldClear) return;
    const key = "streetvault-last-cleared-session";
    const alreadyCleared = sessionId
      ? window.localStorage.getItem(key) === sessionId
      : false;
    if (alreadyCleared) return;
    clearCart();
    window.localStorage.removeItem("streetvault-discount-code");
    if (sessionId) {
      window.localStorage.setItem(key, sessionId);
    }
  }, [clearCart, sessionId, shouldClear]);

  return null;
}
