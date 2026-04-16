"use client";

import { useMemo, useState } from "react";
import { OutfitSlot, ProductWithVariants } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { formatPriceAUD } from "@/lib/utils";

const slotLabels: Record<OutfitSlot, string> = {
  top: "Top",
  bottom: "Bottom",
  accessory: "Accessory",
};

type OutfitBuilderProps = {
  products: ProductWithVariants[];
};

export function OutfitBuilder({ products }: OutfitBuilderProps) {
  const slotOptions: Record<OutfitSlot, ProductWithVariants[]> = {
    top: products.filter((product) => product.outfitSlot === "top"),
    bottom: products.filter((product) => product.outfitSlot === "bottom"),
    accessory: products.filter((product) => product.outfitSlot === "accessory"),
  };

  const [selection, setSelection] = useState<Record<OutfitSlot, string>>({
    top: slotOptions.top[0]?.id ?? "",
    bottom: slotOptions.bottom[0]?.id ?? "",
    accessory: slotOptions.accessory[0]?.id ?? "",
  });
  const { addItems } = useCart();

  const selectedProducts = useMemo(
    () =>
      (Object.keys(selection) as OutfitSlot[])
        .map((slot) => products.find((product) => product.id === selection[slot]))
        .filter((product): product is ProductWithVariants => Boolean(product)),
    [products, selection]
  );

  const total = selectedProducts.reduce(
    (sum, product) => sum + (product.variants[0]?.price ?? 0),
    0
  );

  return (
    <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div>
        <h2 className="text-2xl font-semibold">Build Your Outfit</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Choose one piece from each category and add the full outfit to your cart.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(slotLabels) as OutfitSlot[]).map((slot) => (
          <label key={slot} className="space-y-2">
            <span className="text-sm font-medium text-zinc-300">{slotLabels[slot]}</span>
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
              value={selection[slot]}
              onChange={(event) =>
                setSelection((prev) => ({ ...prev, [slot]: event.target.value }))
              }
            >
              {slotOptions[slot].map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatPriceAUD(product.variants[0]?.price ?? 0)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="font-medium">Selected Items</h3>
        {selectedProducts.map((product) => (
          <div key={product.id} className="flex items-center justify-between text-sm text-zinc-300">
            <span>{product.name}</span>
            <span>{formatPriceAUD(product.variants[0]?.price ?? 0)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-2 font-semibold">
          <span>Total</span>
          <span>{formatPriceAUD(total)}</span>
        </div>
      </div>

      <button
        onClick={() =>
          addItems(
            selectedProducts
              .map((product) => {
                const variant = product.variants.find((item) => item.stock > 0);
                if (!variant) return null;
                return {
                  productId: product.id,
                  variantId: variant.id,
                  size: variant.size,
                  color: variant.color,
                  name: product.name,
                  image: product.builderImage ?? product.mainImage ?? product.images[0],
                  unitPrice: variant.price,
                  shippingRateAUD: product.shippingRateAUD,
                  quantity: 1,
                };
              })
              .filter((item): item is NonNullable<typeof item> => Boolean(item))
          )
        }
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 sm:w-auto"
      >
        Add Full Outfit to Cart
      </button>
    </section>
  );
}
