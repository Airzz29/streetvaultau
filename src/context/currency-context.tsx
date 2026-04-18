"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type CurrencyCode,
  formatMoneyFromAUD,
  findCurrencyForCountry,
} from "@/lib/currency-config";

const STORAGE_CURRENCY = "streetvault-display-currency";
const STORAGE_COUNTRY = "streetvault-shipping-country";

type CurrencyContextValue = {
  currency: CurrencyCode;
  shippingCountryCode: string | null;
  setCurrency: (code: CurrencyCode) => void;
  setShippingCountry: (countryCode: string) => void;
  /** Format a stored AUD amount for the storefront (display only). */
  formatPrice: (amountAud: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("AUD");
  const [shippingCountryCode, setShippingCountryState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCurrency = window.localStorage.getItem(STORAGE_CURRENCY) as CurrencyCode | null;
      const savedCountry = window.localStorage.getItem(STORAGE_COUNTRY);
      if (
        savedCurrency &&
        ["AUD", "USD", "GBP", "EUR", "CNY", "PLN", "NZD", "CAD", "SGD", "CHF", "CZK"].includes(
          savedCurrency
        )
      ) {
        setCurrencyState(savedCurrency);
      }
      if (savedCountry) {
        setShippingCountryState(savedCountry);
      }
    } catch {
      // ignore
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      window.localStorage.setItem(STORAGE_CURRENCY, code);
    } catch {
      // ignore
    }
  }, []);

  const setShippingCountry = useCallback((countryCode: string) => {
    setShippingCountryState(countryCode);
    const nextCurrency = findCurrencyForCountry(countryCode);
    setCurrencyState(nextCurrency);
    try {
      window.localStorage.setItem(STORAGE_COUNTRY, countryCode);
      window.localStorage.setItem(STORAGE_CURRENCY, nextCurrency);
    } catch {
      // ignore
    }
  }, []);

  const formatPrice = useCallback(
    (amountAud: number) => formatMoneyFromAUD(amountAud, currency),
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      shippingCountryCode,
      setCurrency,
      setShippingCountry,
      formatPrice,
    }),
    [currency, shippingCountryCode, setCurrency, setShippingCountry, formatPrice]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider.");
  }
  return ctx;
}

/** Safe for optional use outside provider (falls back to AUD labeling). */
export function useCurrencyOptional(): CurrencyContextValue | null {
  return useContext(CurrencyContext);
}
