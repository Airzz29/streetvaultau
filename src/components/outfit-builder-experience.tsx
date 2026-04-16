"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Rnd } from "react-rnd";
import { ProductWithVariants } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { formatPriceAUD } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { BackNavButton } from "@/components/back-nav-button";

type OutfitBuilderExperienceProps = {
  products: ProductWithVariants[];
  compact?: boolean;
};

type BuilderSlot = "top" | "bottom" | "shoes" | "accessory";
type SlotLayout = { x: number; y: number; width: number };
type CanvasSize = { width: number; height: number };
type SlotSelection = Record<BuilderSlot, { productId: string; color: string }>;

const DEFAULT_LAYOUTS: Record<BuilderSlot, SlotLayout> = {
  top: { x: 55, y: 28, width: 220 },
  bottom: { x: 62, y: 150, width: 210 },
  shoes: { x: 82, y: 300, width: 170 },
  accessory: { x: 120, y: 6, width: 120 },
};

const EMPTY_SELECTION: SlotSelection = {
  top: { productId: "", color: "" },
  bottom: { productId: "", color: "" },
  shoes: { productId: "", color: "" },
  accessory: { productId: "", color: "" },
};

const slotLabels: Record<BuilderSlot, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory (Optional)",
};

function slotProducts(products: ProductWithVariants[], slot: BuilderSlot) {
  if (slot === "top") return products.filter((p) => ["hoodie", "tee"].includes(p.category));
  if (slot === "bottom") return products.filter((p) => p.category === "pants");
  if (slot === "shoes") return products.filter((p) => p.category === "shoes");
  return products.filter((p) => ["cap", "accessory"].includes(p.category));
}

function resolveImageForSlot(product: ProductWithVariants, color: string) {
  const colorGroup = (product.colorImageGroups ?? []).find(
    (group) => group.color.toLowerCase() === color.toLowerCase()
  );
  return (
    colorGroup?.builderImage ??
    colorGroup?.mainImage ??
    product.builderImage ??
    product.mainImage ??
    product.images[0]
  );
}

export function OutfitBuilderExperience({
  products,
  compact = false,
}: OutfitBuilderExperienceProps) {
  const router = useRouter();
  const { addItems } = useCart();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const availableProducts = products.filter((p) => p.variants.some((v) => v.stock > 0));
  const [activeSlot, setActiveSlot] = useState<BuilderSlot | null>(null);
  const [pickerSlot, setPickerSlot] = useState<BuilderSlot | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 360, height: 420 });
  const [isResetting, setIsResetting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [selection, setSelection] = useState<SlotSelection>(EMPTY_SELECTION);
  const [layouts, setLayouts] = useState<Record<BuilderSlot, SlotLayout>>(DEFAULT_LAYOUTS);

  const selectedItems = useMemo(
    () =>
      (Object.keys(selection) as BuilderSlot[])
        .map((slot) => {
          const selected = selection[slot];
          const product = availableProducts.find((p) => p.id === selected.productId);
          return product
            ? {
                slot,
                product,
                color:
                  selected.color ||
                  product.variants.find((variant) => variant.stock > 0)?.color ||
                  product.variants[0]?.color ||
                  "",
              }
            : null;
        })
        .filter(
          (item): item is { slot: BuilderSlot; product: ProductWithVariants; color: string } =>
            Boolean(item)
        ),
    [availableProducts, selection]
  );

  const total = selectedItems.reduce(
    (sum, item) =>
      sum +
      (item.product.variants.find((variant) => variant.stock > 0 && variant.color === item.color)?.price ??
        item.product.variants.find((variant) => variant.stock > 0)?.price ??
        0),
    0
  );

  const addOutfitToCart = () => {
    if (!selectedItems.length) return false;
    const lineItems = selectedItems
      .map((item) => {
        const variant =
          item.product.variants.find(
            (v) => v.stock > 0 && v.color.toLowerCase() === item.color.toLowerCase()
          ) ?? item.product.variants.find((v) => v.stock > 0);
        if (!variant) return null;
        return {
          productId: item.product.id,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          name: item.product.name,
          image: resolveImageForSlot(item.product, variant.color),
          unitPrice: variant.price,
          shippingRateAUD: item.product.shippingRateAUD,
          quantity: 1,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (!lineItems.length) return false;
    addItems(lineItems);
    return true;
  };

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

  const handleAddOutfitToCart = async () => {
    if (!(await ensureLoggedInForCart())) return;
    addOutfitToCart();
  };

  const handleAddOutfitAndCheckout = async () => {
    if (!(await ensureLoggedInForCart())) return;
    const added = addOutfitToCart();
    if (!added) return;
    router.push("/checkout");
  };

  const resetAll = () => {
    setIsResetting(true);
    setSelection(EMPTY_SELECTION);
    setLayouts(DEFAULT_LAYOUTS);
    setActiveSlot(null);
    window.setTimeout(() => setIsResetting(false), 220);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const syncIsMobile = () => setIsMobile(mediaQuery.matches);
    syncIsMobile();
    mediaQuery.addEventListener("change", syncIsMobile);
    return () => mediaQuery.removeEventListener("change", syncIsMobile);
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    const updateCanvasSize = () => {
      setCanvasSize({ width: element.clientWidth, height: element.clientHeight });
    };
    updateCanvasSize();

    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const clampLayoutToCanvas = (next: SlotLayout) => {
    const maxWidth = Math.max(120, Math.min(340, canvasSize.width * 0.84));
    const minWidth = Math.max(isMobile ? 64 : 72, Math.min(120, canvasSize.width * 0.24));
    const width = Math.max(minWidth, Math.min(maxWidth, next.width));
    const maxX = Math.max(0, canvasSize.width - width);
    const maxY = Math.max(0, canvasSize.height - width);
    return {
      width,
      x: Math.max(0, Math.min(maxX, next.x)),
      y: Math.max(0, Math.min(maxY, next.y)),
    };
  };

  const updateLayout = (slot: BuilderSlot, next: SlotLayout) => {
    setLayouts((prev) => ({ ...prev, [slot]: clampLayoutToCanvas(next) }));
  };

  const scaleLayout = (slot: BuilderSlot, direction: "up" | "down") => {
    setLayouts((prev) => {
      const current = prev[slot];
      const delta = direction === "up" ? 14 : -14;
      return {
        ...prev,
        [slot]: clampLayoutToCanvas({ ...current, width: current.width + delta }),
      };
    });
  };

  const nudgeLayout = (slot: BuilderSlot, direction: "up" | "down" | "left" | "right") => {
    const step = isMobile ? 8 : 10;
    setLayouts((prev) => {
      const current = prev[slot];
      const dx = direction === "left" ? -step : direction === "right" ? step : 0;
      const dy = direction === "up" ? -step : direction === "down" ? step : 0;
      return {
        ...prev,
        [slot]: clampLayoutToCanvas({ ...current, x: current.x + dx, y: current.y + dy }),
      };
    });
  };

  const slotChoices = useMemo(
    () =>
      pickerSlot
        ? slotProducts(availableProducts, pickerSlot).filter((product) => {
            const needle = pickerSearch.trim().toLowerCase();
            if (!needle) return true;
            const haystack = `${product.name} ${product.brand ?? ""}`.toLowerCase();
            return haystack.includes(needle);
          })
        : [],
    [availableProducts, pickerSearch, pickerSlot]
  );

  return (
    <section className="space-y-6">
      <BackNavButton fallbackHref="/" label="Back" />
      <div className="space-y-2">
        <h2 className={compact ? "text-2xl font-semibold" : "text-3xl font-semibold"}>
          Outfit Builder
        </h2>
        <p className="text-sm text-zinc-300">
          Build a premium fit with live pricing and in-stock only selections.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-3 sm:p-5">
          <div
            ref={canvasRef}
            className={`relative mx-auto h-[340px] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition-opacity duration-200 sm:h-[420px] ${
              isResetting ? "opacity-70" : "opacity-100"
            }`}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                setActiveSlot(null);
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/50" />
            {selection.accessory.productId ? (
              <DraggableLayer
                slot="accessory"
                product={availableProducts.find((p) => p.id === selection.accessory.productId)}
                selectedColor={selection.accessory.color}
                layout={layouts.accessory}
                zIndex={45}
                isActive={activeSlot === "accessory"}
                maxWidth={Math.max(120, Math.min(340, canvasSize.width * 0.84))}
                minWidth={Math.max(isMobile ? 64 : 72, Math.min(120, canvasSize.width * 0.24))}
                onSelect={setActiveSlot}
                onLayoutLiveChange={updateLayout}
                onLayoutCommit={updateLayout}
              />
            ) : null}
            {selection.top.productId ? (
              <DraggableLayer
                slot="top"
                product={availableProducts.find((p) => p.id === selection.top.productId)}
                selectedColor={selection.top.color}
                layout={layouts.top}
                zIndex={40}
                isActive={activeSlot === "top"}
                maxWidth={Math.max(120, Math.min(340, canvasSize.width * 0.84))}
                minWidth={Math.max(isMobile ? 64 : 72, Math.min(120, canvasSize.width * 0.24))}
                onSelect={setActiveSlot}
                onLayoutLiveChange={updateLayout}
                onLayoutCommit={updateLayout}
              />
            ) : null}
            {selection.bottom.productId ? (
              <DraggableLayer
                slot="bottom"
                product={availableProducts.find((p) => p.id === selection.bottom.productId)}
                selectedColor={selection.bottom.color}
                layout={layouts.bottom}
                zIndex={30}
                isActive={activeSlot === "bottom"}
                maxWidth={Math.max(120, Math.min(340, canvasSize.width * 0.84))}
                minWidth={Math.max(isMobile ? 64 : 72, Math.min(120, canvasSize.width * 0.24))}
                onSelect={setActiveSlot}
                onLayoutLiveChange={updateLayout}
                onLayoutCommit={updateLayout}
              />
            ) : null}
            {selection.shoes.productId ? (
              <DraggableLayer
                slot="shoes"
                product={availableProducts.find((p) => p.id === selection.shoes.productId)}
                selectedColor={selection.shoes.color}
                layout={layouts.shoes}
                zIndex={20}
                isActive={activeSlot === "shoes"}
                maxWidth={Math.max(120, Math.min(340, canvasSize.width * 0.84))}
                minWidth={Math.max(isMobile ? 64 : 72, Math.min(120, canvasSize.width * 0.24))}
                onSelect={setActiveSlot}
                onLayoutLiveChange={updateLayout}
                onLayoutCommit={updateLayout}
              />
            ) : null}
          </div>
          {isMobile && activeSlot && selection[activeSlot].productId ? (
            <div className="anim-soft-in mt-3 space-y-2 rounded-xl border border-white/15 bg-black/35 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">
                Editing {slotLabels[activeSlot]}
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => scaleLayout(activeSlot, "down")}
                  className="rounded-lg border border-white/20 px-2 py-2 text-zinc-100 hover:bg-white/10"
                >
                  Smaller
                </button>
                <button
                  type="button"
                  onClick={() => nudgeLayout(activeSlot, "up")}
                  className="rounded-lg border border-white/20 px-2 py-2 text-zinc-100 hover:bg-white/10"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => scaleLayout(activeSlot, "up")}
                  className="rounded-lg border border-white/20 px-2 py-2 text-zinc-100 hover:bg-white/10"
                >
                  Larger
                </button>
                <button
                  type="button"
                  onClick={() => nudgeLayout(activeSlot, "left")}
                  className="rounded-lg border border-white/20 px-2 py-2 text-zinc-100 hover:bg-white/10"
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => nudgeLayout(activeSlot, "down")}
                  className="rounded-lg border border-white/20 px-2 py-2 text-zinc-100 hover:bg-white/10"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => nudgeLayout(activeSlot, "right")}
                  className="rounded-lg border border-white/20 px-2 py-2 text-zinc-100 hover:bg-white/10"
                >
                  Right
                </button>
              </div>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="space-y-4 p-4 sm:p-5">
          {(Object.keys(slotLabels) as BuilderSlot[]).map((slot) => {
            const selected = selection[slot];
            const selectedProduct = availableProducts.find((product) => product.id === selected.productId);
            return (
              <div key={slot} className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                  {slotLabels[slot]}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerSlot(slot);
                      setPickerSearch("");
                    }}
                    className="rounded-xl border border-zinc-100/60 bg-zinc-100/10 px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-100/20"
                  >
                    Open {slotLabels[slot]}
                  </button>
                  {selectedProduct ? (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                      {selectedProduct.name} - {selected.color}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">No item selected</div>
                  )}
                  {slot === "accessory" ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelection((prev) => ({
                          ...prev,
                          accessory: { productId: "", color: "" },
                        }))
                      }
                      className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-300"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Outfit total</span>
              <span className="font-semibold">{formatPriceAUD(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={handleAddOutfitToCart}
              className="rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_6px_20px_rgba(255,255,255,0.18)] transition hover:bg-white"
            >
              Add Outfit to Cart
            </button>
            <button
              onClick={resetAll}
              className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-zinc-100 transition hover:bg-white/10"
            >
              Reset Outfit
            </button>
            {!compact ? (
              <button
                onClick={handleAddOutfitAndCheckout}
                className="rounded-xl border border-white/30 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/10 sm:col-span-2"
              >
                Add Outfit & Checkout
              </button>
            ) : null}
          </div>
        </GlassCard>
      </div>
      {pickerSlot ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/65 p-3 sm:items-center sm:justify-center">
          <div className="anim-soft-in w-full max-w-3xl rounded-2xl border border-white/15 bg-zinc-950/95 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Select {slotLabels[pickerSlot]}</h3>
              <button
                type="button"
                onClick={() => setPickerSlot(null)}
                className="rounded border border-white/20 px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>
            <input
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder="Search by brand or product name"
              className="mb-3 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
            />
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
              {slotChoices.map((product) => {
                const colors = Array.from(
                  new Set(
                    product.variants.filter((variant) => variant.stock > 0).map((variant) => variant.color)
                  )
                );
                return (
                  <div key={product.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="relative h-24 overflow-hidden rounded-lg">
                      <Image
                        src={product.builderImage ?? product.mainImage ?? product.images[0]}
                        alt={product.name}
                        fill
                        sizes="320px"
                        className="object-contain"
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-zinc-400">{product.brand ?? "StreetVault"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {colors.map((color) => (
                        <button
                          key={`${product.id}-${color}`}
                          type="button"
                          onClick={() => {
                            setSelection((prev) => ({
                              ...prev,
                              [pickerSlot]: { productId: product.id, color },
                            }));
                            setActiveSlot(pickerSlot);
                            setPickerSlot(null);
                          }}
                          className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DraggableLayer({
  slot,
  product,
  selectedColor,
  layout,
  zIndex,
  isActive,
  maxWidth,
  minWidth,
  onSelect,
  onLayoutLiveChange,
  onLayoutCommit,
}: {
  slot: BuilderSlot;
  product: ProductWithVariants | undefined;
  selectedColor: string;
  layout: SlotLayout;
  zIndex: number;
  isActive: boolean;
  maxWidth: number;
  minWidth: number;
  onSelect: (slot: BuilderSlot) => void;
  onLayoutLiveChange: (slot: BuilderSlot, next: SlotLayout) => void;
  onLayoutCommit: (slot: BuilderSlot, next: SlotLayout) => void;
}) {
  if (!product) return null;

  return (
    <Rnd
      bounds="parent"
      size={{ width: layout.width, height: layout.width }}
      position={{ x: layout.x, y: layout.y }}
      lockAspectRatio
      minWidth={minWidth}
      maxWidth={maxWidth}
      onMouseDown={() => onSelect(slot)}
      onTouchStart={() => onSelect(slot)}
      onDragStart={() => onSelect(slot)}
      onDrag={(_, data) => onLayoutLiveChange(slot, { ...layout, x: data.x, y: data.y })}
      onDragStop={(_, data) =>
        onLayoutCommit(slot, { ...layout, x: data.x, y: data.y })
      }
      onResize={(_, __, ref, ___, position) =>
        onLayoutLiveChange(slot, { width: ref.offsetWidth, x: position.x, y: position.y })
      }
      onResizeStop={(_, __, ref, ___, position) =>
        onLayoutCommit(slot, { width: ref.offsetWidth, x: position.x, y: position.y })
      }
      style={{ zIndex }}
      dragHandleClassName="builder-touch-surface"
      enableResizing={
        isActive
          ? {
              top: false,
              right: false,
              bottom: false,
              left: false,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }
          : false
      }
      resizeHandleClasses={{
        topLeft: "builder-handle",
        topRight: "builder-handle",
        bottomLeft: "builder-handle",
        bottomRight: "builder-handle",
      }}
    >
      <div
        className={`builder-touch-surface relative h-full w-full overflow-hidden rounded-lg transition-all duration-150 ${
          isActive
            ? "ring-2 ring-white/90 ring-offset-2 ring-offset-black/40 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]"
            : "ring-1 ring-transparent"
        }`}
      >
        <div className="absolute inset-0 z-20 rounded-lg" />
        <div
          className={`pointer-events-none absolute -left-1.5 -top-1.5 z-30 h-3.5 w-3.5 rounded-full border border-zinc-900 bg-white shadow transition-opacity ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute -right-1.5 -top-1.5 z-30 h-3.5 w-3.5 rounded-full border border-zinc-900 bg-white shadow transition-opacity ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-1.5 -left-1.5 z-30 h-3.5 w-3.5 rounded-full border border-zinc-900 bg-white shadow transition-opacity ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-1.5 -right-1.5 z-30 h-3.5 w-3.5 rounded-full border border-zinc-900 bg-white shadow transition-opacity ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        />
        <Image
          src={resolveImageForSlot(product, selectedColor)}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 70vw, 28vw"
          className="object-contain mix-blend-screen opacity-95"
        />
      </div>
    </Rnd>
  );
}
