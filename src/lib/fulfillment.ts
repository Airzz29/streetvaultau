/** Fulfillment routing (display pricing + order channel). Stock rules live in store-db. */

export type FulfillmentType = "physical" | "dropship";
export type FulfillmentChannel = "local" | "dropship";

/** True if country string represents Australia (English label or ISO). */
export function isAustraliaShipping(country: string | null | undefined): boolean {
  const n = (country ?? "").trim().toLowerCase();
  return n === "australia" || n === "au";
}

export function lineFulfillmentChannel(
  fulfillmentType: FulfillmentType,
  shippingCountry: string
): FulfillmentChannel {
  if (fulfillmentType === "dropship") return "dropship";
  return isAustraliaShipping(shippingCountry) ? "local" : "dropship";
}

/** Order-level channel: dropship if any line is routed to dropship. */
export function orderFulfillmentChannelFromLines(channels: FulfillmentChannel[]): FulfillmentChannel {
  return channels.some((c) => c === "dropship") ? "dropship" : "local";
}

export function shouldApplyGlobalSurcharge(
  fulfillmentType: FulfillmentType,
  shippingCountry: string
): boolean {
  return lineFulfillmentChannel(fulfillmentType, shippingCountry) === "dropship";
}

export function unitPriceAudWithSurcharge(
  baseVariantPriceAud: number,
  fulfillmentType: FulfillmentType,
  shippingCountry: string,
  globalSurchargeAud: number
): number {
  return shouldApplyGlobalSurcharge(fulfillmentType, shippingCountry)
    ? baseVariantPriceAud + globalSurchargeAud
    : baseVariantPriceAud;
}
