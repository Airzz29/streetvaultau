"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ProductWithVariants } from "@/types/product";
import { PremadeFit, PremadeFitItemSlot } from "@/types/premade-fit";

type FitItemForm = {
  id: string;
  slot: PremadeFitItemSlot;
  isOptional: boolean;
  productId: string;
  itemMainImage: string;
  selectionMode: "fixed" | "selectable";
  allowedColors: string;
  allowedSizes: string;
  defaultVariantId: string;
  sortOrder: number;
};

const FIT_SLOT_META: Array<{ slot: PremadeFitItemSlot; label: string; required: boolean; multi: boolean }> = [
  { slot: "top", label: "Top (Shirt)", required: false, multi: false },
  { slot: "hoodie", label: "Hoodie", required: false, multi: false },
  { slot: "pants", label: "Pants", required: true, multi: false },
  { slot: "shoes", label: "Shoes", required: false, multi: false },
  { slot: "accessory", label: "Accessories", required: false, multi: true },
];

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminPremadeFitsPage() {
  const [fits, setFits] = useState<PremadeFit[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<{ slot: PremadeFitItemSlot; itemId?: string } | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    coverImage: "",
    galleryImages: "",
    active: true,
    featured: false,
  });
  const [items, setItems] = useState<FitItemForm[]>([
    {
      id: crypto.randomUUID(),
      slot: "top",
      isOptional: false,
      productId: "",
      itemMainImage: "",
      selectionMode: "fixed",
      allowedColors: "",
      allowedSizes: "",
      defaultVariantId: "",
      sortOrder: 0,
    },
    {
      id: crypto.randomUUID(),
      slot: "pants",
      isOptional: false,
      productId: "",
      itemMainImage: "",
      selectionMode: "fixed",
      allowedColors: "",
      allowedSizes: "",
      defaultVariantId: "",
      sortOrder: 1,
    },
  ]);

  const load = async () => {
    const [fitsResponse, productsResponse] = await Promise.all([
      fetch("/api/admin/premade-fits", { cache: "no-store", credentials: "include" }),
      fetch("/api/admin/products", { cache: "no-store", credentials: "include" }),
    ]);
    const fitsData = await fitsResponse.json();
    const productsData = await productsResponse.json();
    setFits(fitsData.fits ?? []);
    setProducts(productsData.products ?? []);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return [];
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Upload failed.");
    return (data.paths ?? []) as string[];
  };

  const onCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const [uploaded] = await uploadFiles(event.target.files);
      if (!uploaded) return;
      setForm((prev) => {
        const existingGallery = prev.galleryImages
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return {
          ...prev,
          coverImage: uploaded,
          galleryImages: Array.from(new Set([uploaded, ...existingGallery])).join("\n"),
        };
      });
    } finally {
      event.target.value = "";
    }
  };

  const onGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const uploaded = await uploadFiles(event.target.files);
      if (!uploaded.length) return;
      setForm((prev) => {
        const existing = prev.galleryImages
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return {
          ...prev,
          galleryImages: Array.from(new Set([...existing, ...uploaded])).join("\n"),
        };
      });
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      coverImage: "",
      galleryImages: "",
      active: true,
      featured: false,
    });
    setItems([
      {
        id: crypto.randomUUID(),
        slot: "top",
        isOptional: false,
        productId: "",
        itemMainImage: "",
        selectionMode: "fixed",
        allowedColors: "",
        allowedSizes: "",
        defaultVariantId: "",
        sortOrder: 0,
      },
      {
        id: crypto.randomUUID(),
        slot: "pants",
        isOptional: false,
        productId: "",
        itemMainImage: "",
        selectionMode: "fixed",
        allowedColors: "",
        allowedSizes: "",
        defaultVariantId: "",
        sortOrder: 1,
      },
    ]);
  };

  const createEmptyItem = (slot: PremadeFitItemSlot): FitItemForm => ({
    id: crypto.randomUUID(),
    slot,
    isOptional: slot === "shoes" || slot === "accessory" || slot === "hoodie",
    productId: "",
    itemMainImage: "",
    selectionMode: "fixed",
    allowedColors: "",
    allowedSizes: "",
    defaultVariantId: "",
    sortOrder: items.length,
  });

  const productsForSlot = useMemo(() => {
    const bySlot: Record<PremadeFitItemSlot, ProductWithVariants[]> = {
      top: products.filter((product) => product.category === "tee"),
      hoodie: products.filter((product) => product.category === "hoodie"),
      pants: products.filter(
        (product) =>
          product.category === "pants" &&
          ["shorts", "jeans", "joggers", "pants"].some((token) =>
            (product.productType ?? "pants").toLowerCase().includes(token)
          )
      ),
      shoes: products.filter((product) => product.category === "shoes"),
      accessory: products.filter((product) => ["accessory", "cap"].includes(product.category)),
    };
    return bySlot;
  }, [products]);

  const pickerResults = useMemo(() => {
    if (!picker) return [];
    const needle = pickerSearch.trim().toLowerCase();
    return productsForSlot[picker.slot].filter((product) => {
      if (!needle) return true;
      return `${product.name} ${product.brand ?? ""}`.toLowerCase().includes(needle);
    });
  }, [picker, pickerSearch, productsForSlot]);

  const assignProductToItem = (slot: PremadeFitItemSlot, productId: string, itemId?: string) => {
    if (itemId) {
      setItems((prev) =>
        prev.map((entry) => (entry.id === itemId ? { ...entry, productId } : entry))
      );
      return;
    }
    const existingSingle = items.find((entry) => entry.slot === slot);
    if (slot !== "accessory" && existingSingle) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === existingSingle.id ? { ...entry, productId } : entry
        )
      );
      return;
    }
    setItems((prev) => [...prev, { ...createEmptyItem(slot), productId }]);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      coverImage: form.coverImage.trim(),
      galleryImages: Array.from(
        new Set(
          [form.coverImage.trim(), ...form.galleryImages.split("\n").map((line) => line.trim())].filter(Boolean)
        )
      ),
      active: form.active,
      featured: form.featured,
      items: items
        .filter((item) => item.productId)
        .map((item, index) => ({
          slot: item.slot,
          isOptional: item.isOptional,
          productId: item.productId,
          selectionMode: item.selectionMode,
          allowedColors: item.allowedColors
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
          allowedSizes: item.allowedSizes
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
          defaultVariantId: item.defaultVariantId || null,
          itemMainImage: item.itemMainImage.trim() || null,
          sortOrder: index,
        })),
    };
    const response = await fetch("/api/admin/premade-fits", {
      method: editingId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Unable to save premade fit.");
      return;
    }
    setMessage(editingId ? "Premade fit updated." : "Premade fit created.");
    resetForm();
    await load();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Premade Fits</h2>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-sm font-semibold">{editingId ? "Edit fit" : "Create fit"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Fit name"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="Slug"
              className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
            />
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, slug: toSlug(prev.name) }))}
              className="rounded-lg border border-white/20 px-3 text-xs hover:bg-white/10"
            >
              Auto
            </button>
          </div>
          <input
            value={form.coverImage}
            onChange={(event) => setForm((prev) => ({ ...prev, coverImage: event.target.value }))}
            placeholder="Cover image path"
            className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2"
          />
          <input
            type="file"
            accept="image/png,image/webp,image/jpeg,image/jpg"
            onChange={onCoverUpload}
            className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900 sm:col-span-2"
          />
          <textarea
            value={form.galleryImages}
            onChange={(event) => setForm((prev) => ({ ...prev, galleryImages: event.target.value }))}
            placeholder="Gallery images (one per line)"
            className="min-h-20 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="file"
            multiple
            accept="image/png,image/webp,image/jpeg,image/jpg"
            onChange={onGalleryUpload}
            className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900 sm:col-span-2"
          />
          {form.coverImage ? (
            <div className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 p-2">
              <p className="mb-2 text-xs text-zinc-400">Fit main image preview</p>
              <div className="relative h-40 overflow-hidden rounded border border-white/10">
                <Image src={form.coverImage} alt="Fit cover" fill sizes="600px" className="object-cover" />
              </div>
            </div>
          ) : null}
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="min-h-20 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm sm:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
            />
            Featured
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Structured Outfit Composition</p>
          {FIT_SLOT_META.map((slotMeta) => {
            const sectionItems = items.filter((entry) => entry.slot === slotMeta.slot);
            return (
              <div key={slotMeta.slot} className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {slotMeta.label}{" "}
                    <span className="text-xs font-normal text-zinc-400">
                      {slotMeta.required ? "(required)" : "(optional)"}
                    </span>
                  </p>
                  {slotMeta.multi || sectionItems.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (slotMeta.multi || sectionItems.length === 0) {
                          if (slotMeta.multi) {
                            const created = createEmptyItem(slotMeta.slot);
                            setItems((prev) => [...prev, created]);
                            setPicker({ slot: slotMeta.slot, itemId: created.id });
                            setPickerSearch("");
                          } else {
                            setPicker({ slot: slotMeta.slot });
                            setPickerSearch("");
                          }
                        }
                      }}
                      className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                    >
                      Select {slotMeta.label}
                    </button>
                  ) : null}
                </div>
                {sectionItems.length === 0 ? (
                  <p className="text-xs text-zinc-500">No product assigned yet.</p>
                ) : null}
                {sectionItems.map((item, index) => {
                  const product = products.find((entry) => entry.id === item.productId);
                  return (
                    <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-2 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 p-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded border border-white/10 bg-black/30">
                      {product ? (
                        <Image
                          src={item.itemMainImage || product.mainImage || product.images[0]}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="text-xs text-zinc-300">
                      <p className="font-semibold">{product?.name ?? "No product selected"}</p>
                      <p className="text-zinc-500">
                        {product?.brand ?? "StreetVault"} · {product?.category ?? "N/A"} ·{" "}
                        {product?.productType ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPicker({ slot: item.slot, itemId: item.id });
                      setPickerSearch("");
                    }}
                    className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                  >
                    Change
                  </button>
                </div>
                <select
                  value={item.productId}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id ? { ...entry, productId: event.target.value } : entry
                      )
                    )
                  }
                  className="min-h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-xs"
                >
                  <option value="">Select product</option>
                  {products.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={item.isOptional}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, isOptional: event.target.checked } : entry
                        )
                      )
                    }
                  />
                  Customer can skip this item
                </label>
                <select
                  value={item.selectionMode}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, selectionMode: event.target.value as "fixed" | "selectable" }
                          : entry
                      )
                    )
                  }
                  className="min-h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-xs"
                >
                  <option value="fixed">Fixed variant</option>
                  <option value="selectable">Customer selectable</option>
                </select>
                <input
                  value={item.allowedColors}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((entry) => (entry.id === item.id ? { ...entry, allowedColors: event.target.value } : entry))
                    )
                  }
                  placeholder="Allowed colors (comma separated)"
                  className="min-h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-xs"
                />
                <input
                  value={item.allowedSizes}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((entry) => (entry.id === item.id ? { ...entry, allowedSizes: event.target.value } : entry))
                    )
                  }
                  placeholder="Allowed sizes (comma separated)"
                  className="min-h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-xs"
                />
                <input
                  value={item.itemMainImage}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id ? { ...entry, itemMainImage: event.target.value } : entry
                      )
                    )
                  }
                  placeholder="Item main image path (optional)"
                  className="min-h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-xs sm:col-span-2"
                />
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg,image/jpg"
                  onChange={async (event) => {
                    try {
                      const [uploaded] = await uploadFiles(event.target.files);
                      if (!uploaded) return;
                      setItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, itemMainImage: uploaded } : entry
                        )
                      );
                    } finally {
                      event.target.value = "";
                    }
                  }}
                  className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900 sm:col-span-2"
                />
                {item.itemMainImage ? (
                  <div className="sm:col-span-2 rounded border border-white/10 bg-black/20 p-2">
                    <p className="mb-2 text-[11px] text-zinc-400">Item image preview</p>
                    <div className="relative h-24 overflow-hidden rounded border border-white/10">
                      <Image
                        src={item.itemMainImage}
                        alt="Included item"
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : null}
                <select
                  value={item.defaultVariantId}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id ? { ...entry, defaultVariantId: event.target.value } : entry
                      )
                    )
                  }
                  className="min-h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-xs sm:col-span-2"
                >
                  <option value="">Default variant</option>
                  {(product?.variants ?? []).map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.color} / {variant.size} ({variant.stock})
                    </option>
                  ))}
                </select>
                <div className="sm:col-span-2 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">Order #{index + 1} in {slotMeta.label}</p>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                    className="rounded border border-red-400/50 px-2 py-1 text-xs text-red-200"
                  >
                    Remove
                  </button>
                </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
            {editingId ? "Update Fit" : "Create Fit"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      </form>

      <div className="space-y-2">
        {fits.map((fit) => (
          <article key={fit.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{fit.name}</p>
                <p className="text-xs text-zinc-500">{fit.slug}</p>
                <p className="text-xs text-zinc-400">
                  {fit.items.length} items · {fit.active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(fit.id);
                    setForm({
                      name: fit.name,
                      slug: fit.slug,
                      description: fit.description,
                      coverImage: fit.coverImage,
                      galleryImages: fit.galleryImages.join("\n"),
                      active: fit.active,
                      featured: fit.featured,
                    });
                    setItems(
                      fit.items.map((item, index) => ({
                        id: item.id,
                        slot: item.slot,
                        isOptional: item.isOptional,
                        productId: item.productId,
                        itemMainImage: item.itemMainImage ?? "",
                        selectionMode: item.selectionMode,
                        allowedColors: item.allowedColors.join(", "),
                        allowedSizes: item.allowedSizes.join(", "),
                        defaultVariantId: item.defaultVariantId ?? "",
                        sortOrder: item.sortOrder ?? index,
                      }))
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/admin/premade-fits", {
                      method: "DELETE",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: fit.id }),
                    });
                    await load();
                  }}
                  className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {picker ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-3">
          <div className="w-full max-w-4xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                Select {FIT_SLOT_META.find((entry) => entry.slot === picker.slot)?.label ?? "Item"}
              </p>
              <button
                type="button"
                onClick={() => setPicker(null)}
                className="rounded border border-white/20 px-2 py-1 text-xs"
              >
                Close
              </button>
            </div>
            <input
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder="Search by product name or brand"
              className="mb-3 min-h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
            />
            <div className="grid max-h-[65vh] gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {pickerResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    assignProductToItem(picker.slot, product.id, picker.itemId);
                    setPicker(null);
                  }}
                  className="rounded-xl border border-white/15 bg-black/30 p-2 text-left hover:bg-white/10"
                >
                  <div className="relative h-28 overflow-hidden rounded border border-white/10">
                    <Image
                      src={product.mainImage ?? product.images[0]}
                      alt={product.name}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-zinc-400">
                    {product.brand ?? "StreetVault"} · {product.category} · {product.productType ?? "N/A"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
