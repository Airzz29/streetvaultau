"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductWithVariants } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { useCurrency } from "@/context/currency-context";

type ProductPurchasePanelProps = {
  product: ProductWithVariants;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
};

function getVariantKey(color: string, size: string) {
  return `${color.trim().toLowerCase()}::${size.trim().toLowerCase()}`;
}

export function ProductPurchasePanel({
  product,
  selectedColor: controlledSelectedColor,
  onColorChange,
}: ProductPurchasePanelProps) {
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const { addItem } = useCart();
  const defaultVariant =
    product.variants.find(
      (variant) =>
        product.defaultVariantKey &&
        getVariantKey(variant.color, variant.size) === product.defaultVariantKey
    ) ??
    product.variants.find((variant) => variant.stock > 0) ??
    product.variants[0];
  const [selectedColorInternal, setSelectedColorInternal] = useState(
    defaultVariant?.color ?? ""
  );
  const selectedColor = controlledSelectedColor ?? selectedColorInternal;
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants.find((variant) => variant.id === defaultVariant?.id)?.id ??
      product.variants.find((variant) => variant.stock > 0 && variant.color === selectedColor)?.id ??
      product.variants.find((variant) => variant.color === selectedColor)?.id ??
      product.variants.find((variant) => variant.stock > 0)?.id ??
      product.variants[0]?.id
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId),
    [product.variants, selectedVariantId]
  );
  const allSoldOut = product.variants.every((variant) => variant.stock <= 0);

  const colorVariants = product.variants.filter((variant) => variant.color === selectedColor);
  const hasColorInStock = colorVariants.some((variant) => variant.stock > 0);
  const maxQty = selectedVariant?.stock ?? 0;

  const stockLabel = allSoldOut
    ? "Sold Out"
    : maxQty <= 0
      ? "Sold Out"
      : maxQty <= 3
        ? `Low stock: ${maxQty} left`
        : "In stock";

  const colorOptions = Array.from(new Set(product.variants.map((variant) => variant.color)));

  useEffect(() => {
    setQuantity((prev) => Math.min(Math.max(prev, 1), Math.max(maxQty, 1)));
  }, [maxQty]);

  useEffect(() => {
    if (!selectedColor) return;
    const current = product.variants.find((variant) => variant.id === selectedVariantId);
    if (current?.color === selectedColor) return;
    const nextForColor =
      product.variants.find((variant) => variant.color === selectedColor && variant.stock > 0) ??
      product.variants.find((variant) => variant.color === selectedColor);
    if (nextForColor) {
      setSelectedVariantId(nextForColor.id);
    }
  }, [product.variants, selectedColor, selectedVariantId]);

  const ensureLoggedInForCart = async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json();
    if (!data?.user) {
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/login?next=${next}&reason=add_to_cart`);
      return false;
    }
    return true;
  };

  const addCurrentToCart = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      color: selectedVariant.color,
      name: product.name,
      image: product.builderImage ?? product.mainImage ?? product.images[0],
      unitPrice: selectedVariant.price,
      shippingRateAUD: product.shippingRateAUD,
      quantity,
    });
  };

  const handleAddToCart = async () => {
    if (!(await ensureLoggedInForCart())) return;
    addCurrentToCart();
  };

  const handleBuyNow = async () => {
    if (!(await ensureLoggedInForCart())) return;
    addCurrentToCart();
    router.push("/checkout");
  };

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <div className="flex items-center gap-3 text-sm">
        <span
          className={`rounded-full px-2 py-1 ${
            maxQty <= 0 || allSoldOut
              ? "bg-red-950 text-red-300"
              : maxQty <= 3
                ? "bg-amber-950 text-amber-300"
                : "bg-emerald-950 text-emerald-300"
          }`}
        >
          {stockLabel}
        </span>
        {maxQty <= 0 || allSoldOut ? (
          <span className="text-xs text-zinc-400">Coming back in stock in 14 days</span>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-400">Color</p>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => {
            const isActive = color === selectedColor;
            return (
              <button
                key={color}
                onClick={() => {
                  const next =
                    product.variants.find((variant) => variant.color === color && variant.stock > 0) ??
                    product.variants.find((variant) => variant.color === color);
                  if (next) setSelectedVariantId(next.id);
                  setSelectedColorInternal(color);
                  onColorChange?.(color);
                  setQuantity(1);
                }}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isActive
                    ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                    : "border-zinc-700 text-zinc-200"
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
        {!hasColorInStock ? <p className="text-xs text-red-300">This color is currently sold out.</p> : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-400">Size</p>
        <div className="flex flex-wrap gap-2">
          {colorVariants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariantId(variant.id)}
              disabled={variant.stock <= 0}
              className={`rounded-lg border px-3 py-2 text-sm ${
                selectedVariant?.id === variant.id
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                  : "border-zinc-700 text-zinc-200"
              } disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600`}
            >
              {variant.size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-400">Quantity</p>
        <div className="flex w-full max-w-[220px] items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={maxQty <= 0}
            className="min-h-11 rounded-lg px-3 py-2 text-base text-zinc-100 hover:bg-white/10 disabled:opacity-40"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={Math.max(maxQty, 1)}
            value={quantity}
            disabled={maxQty <= 0}
            onChange={(event) => {
              const next = Number(event.target.value || 1);
              setQuantity(Math.min(Math.max(next, 1), Math.max(maxQty, 1)));
            }}
            className="w-16 bg-transparent text-center text-base outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.max(maxQty, 1), q + 1))}
            disabled={maxQty <= 0}
            className="min-h-11 rounded-lg px-3 py-2 text-base text-zinc-100 hover:bg-white/10 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Selected Price</span>
        <span className="font-semibold">
          {formatPrice((selectedVariant?.price ?? 0) * quantity)}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          disabled={!selectedVariant || selectedVariant.stock <= 0}
          onClick={handleAddToCart}
          className="rounded-xl border border-zinc-600 px-4 py-3 text-sm font-semibold hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {maxQty <= 0 || allSoldOut ? "Sold Out" : "Add to Cart"}
        </button>
        <button
          disabled={!selectedVariant || selectedVariant.stock <= 0}
          onClick={handleBuyNow}
          className="rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {maxQty <= 0 || allSoldOut ? "Unavailable" : "Buy Now"}
        </button>
      </div>
    </div>
  );
}
