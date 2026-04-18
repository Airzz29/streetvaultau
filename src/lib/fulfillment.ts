/** Fulfillment routing (display pricing + order channel). Stock rules live in store-db. */

import { canonicalShippingCountryCode } from "@/lib/currency-config";

export type FulfillmentType = "physical" | "dropship";
export type FulfillmentChannel = "local" | "dropship";

export type LineFulfillmentOpts = {
  variantStock: number;
  allowDropshipFallback: boolean;
  requestedQty: number;
};

/** True if country string represents Australia (full name, ISO, or common aliases). */
export function isAustraliaShipping(country: string | null | undefined): boolean {
  if (!country?.trim()) return false;
  const n = country.trim().toLowerCase();
  if (n === "australia" || n === "au") return true;
  return canonicalShippingCountryCode(country) === "AU";
}

/**
 * Effective fulfillment channel for a cart line (pricing + routing).
 * Physical + Australia: local only when enough stock for the requested quantity;
 * otherwise dropship if fallback is enabled.
 */
export function lineFulfillmentChannel(
  fulfillmentType: FulfillmentType,
  shippingCountry: string,
  opts: LineFulfillmentOpts
): FulfillmentChannel {
  if (fulfillmentType === "dropship") return "dropship";
  if (!isAustraliaShipping(shippingCountry)) return "dropship";
  const { variantStock, allowDropshipFallback, requestedQty } = opts;
  if (variantStock >= requestedQty) return "local";
  if (allowDropshipFallback) return "dropship";
  return "local";
}

/** Order-level channel: dropship if any line is routed to dropship. */
export function orderFulfillmentChannelFromLines(channels: FulfillmentChannel[]): FulfillmentChannel {
  return channels.some((c) => c === "dropship") ? "dropship" : "local";
}

export function shouldApplyGlobalSurcharge(
  fulfillmentType: FulfillmentType,
  shippingCountry: string,
  opts: LineFulfillmentOpts
): boolean {
  return lineFulfillmentChannel(fulfillmentType, shippingCountry, opts) === "dropship";
}

export function unitPriceAudWithSurcharge(
  baseVariantPriceAud: number,
  fulfillmentType: FulfillmentType,
  shippingCountry: string,
  globalSurchargeAud: number,
  opts: LineFulfillmentOpts
): number {
  return shouldApplyGlobalSurcharge(fulfillmentType, shippingCountry, opts)
    ? baseVariantPriceAud + globalSurchargeAud
    : baseVariantPriceAud;
}

/** Storefront availability (no shipping country — catalog / PDP). */
export type StorefrontAvailability = "in_stock" | "global_network" | "sold_out";

export function storefrontVariantAvailability(
  fulfillmentType: FulfillmentType,
  variantStock: number,
  allowDropshipFallback: boolean
): StorefrontAvailability {
  if (fulfillmentType === "dropship") return "in_stock";
  if (variantStock > 0) return "in_stock";
  if (allowDropshipFallback) return "global_network";
  return "sold_out";
}
