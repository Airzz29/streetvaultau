/** Display-only conversion from stored AUD amounts. Rates are indicative; refresh periodically or swap for a live FX API later. */
export type CurrencyCode =
  | "AUD"
  | "USD"
  | "GBP"
  | "EUR"
  | "CNY"
  | "PLN"
  | "NZD"
  | "CAD"
  | "SGD"
  | "CHF"
  | "CZK";

export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbol: string;
};

/** All currencies shown in the picker (order matches design reference). */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "CNY", label: "CNY", symbol: "¥" },
  { code: "USD", label: "USD", symbol: "$" },
  { code: "GBP", label: "GBP", symbol: "£" },
  { code: "EUR", label: "EUR", symbol: "€" },
  { code: "PLN", label: "PLN", symbol: "zł" },
  { code: "NZD", label: "NZD", symbol: "NZ$" },
  { code: "AUD", label: "AUD", symbol: "A$" },
  { code: "CAD", label: "CAD", symbol: "C$" },
  { code: "SGD", label: "SGD", symbol: "S$" },
  { code: "CHF", label: "CHF", symbol: "CHF" },
  { code: "CZK", label: "CZK", symbol: "Kč" },
];

/** Foreign currency units per 1.00 AUD (approximate retail display rates). */
export const AUD_TO_FOREIGN: Record<CurrencyCode, number> = {
  AUD: 1,
  USD: 0.64,
  GBP: 0.51,
  EUR: 0.59,
  CNY: 4.68,
  PLN: 2.48,
  NZD: 1.08,
  CAD: 0.89,
  SGD: 0.86,
  CHF: 0.56,
  CZK: 14.6,
};

const localeByCurrency: Record<CurrencyCode, string> = {
  AUD: "en-AU",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  CNY: "zh-CN",
  PLN: "pl-PL",
  NZD: "en-NZ",
  CAD: "en-CA",
  SGD: "en-SG",
  CHF: "de-CH",
  CZK: "cs-CZ",
};

export function convertFromAUD(amountAud: number, currency: CurrencyCode): number {
  const rate = AUD_TO_FOREIGN[currency];
  return amountAud * rate;
}

export function formatMoneyFromAUD(amountAud: number, currency: CurrencyCode): string {
  const value = convertFromAUD(amountAud, currency);
  const locale = localeByCurrency[currency];
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export type ShippingCountry = {
  code: string;
  name: string;
  currency: CurrencyCode;
};

/** Shipping destination → display currency (common retail mappings). */
export const SHIPPING_COUNTRIES: ShippingCountry[] = [
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "PL", name: "Poland", currency: "PLN" },
  { code: "CZ", name: "Czech Republic", currency: "CZK" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  { code: "CN", name: "China", currency: "CNY" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "HK", name: "Hong Kong", currency: "USD" },
  { code: "JP", name: "Japan", currency: "USD" },
  { code: "KR", name: "South Korea", currency: "USD" },
  { code: "IN", name: "India", currency: "USD" },
  { code: "AE", name: "United Arab Emirates", currency: "USD" },
  { code: "SA", name: "Saudi Arabia", currency: "USD" },
  { code: "BR", name: "Brazil", currency: "USD" },
  { code: "MX", name: "Mexico", currency: "USD" },
  { code: "ZA", name: "South Africa", currency: "USD" },
  { code: "XX", name: "Other / International", currency: "USD" },
];

export function findCurrencyForCountry(code: string): CurrencyCode {
  const row = SHIPPING_COUNTRIES.find((c) => c.code === code);
  return row?.currency ?? "USD";
}

/** English shipping country name for checkout / forms (matches stored address labels). */
export function getShippingCountryDisplayName(code: string | null | undefined): string | null {
  if (!code?.trim()) return null;
  const row = SHIPPING_COUNTRIES.find((c) => c.code === code.trim().toUpperCase());
  return row?.name ?? null;
}
