import { CartItem } from "@/types/product";

export function applyDiscountAcrossItems(items: CartItem[], discountAmountAUD: number) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity,
    0
  );
  const discountCents = Math.max(0, Math.min(subtotalCents, Math.round(discountAmountAUD * 100)));
  if (!discountCents) {
    return items.map((item) => ({ ...item, discountedUnitAmountCents: Math.round(item.unitPrice * 100) }));
  }

  let remainingDiscount = discountCents;
  const adjusted = items.map((item, index) => {
    const unitCents = Math.round(item.unitPrice * 100);
    const lineSubtotal = unitCents * item.quantity;
    let lineDiscount =
      index === items.length - 1
        ? remainingDiscount
        : Math.floor((lineSubtotal / subtotalCents) * discountCents);
    lineDiscount = Math.max(0, Math.min(lineSubtotal, lineDiscount));
    remainingDiscount -= lineDiscount;
    const effectiveLine = lineSubtotal - lineDiscount;
    const discountedUnitAmountCents = Math.max(0, Math.floor(effectiveLine / item.quantity));
    return { ...item, discountedUnitAmountCents };
  });
  return adjusted;
}

