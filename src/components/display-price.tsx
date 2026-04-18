"use client";

import { useCurrency } from "@/context/currency-context";

/** Renders a storefront price from stored AUD amounts using the visitor’s selected display currency. */
export function DisplayPrice({ amountAud }: { amountAud: number }) {
  const { formatPrice } = useCurrency();
  return <>{formatPrice(amountAud)}</>;
}
