"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { formatPriceAUD } from "@/lib/utils";
import { ProductColorImageGroup, ProductWithVariants } from "@/types/product";

function getVariantKey(color: string, size: string) {
  return `${color.trim().toLowerCase()}::${size.trim().toLowerCase()}`;
}

const categoryOptions = [
  { value: "hoodie", label: "Hoodies" },
  { value: "tee", label: "Shirts" },
  { value: "pants", label: "Jeans / Pants" },
  { value: "shoes", label: "Shoes" },
  { value: "cap", label: "Caps" },
  { value: "accessory", label: "Accessories" },
];

function categoryLabel(value: string) {
  return categoryOptions.find((option) => option.value === value)?.label ?? value;
}

export default function AdminProductsRoute() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    brand: "StreetVault",
    collection: "Core",
    productType: "Apparel",
    category: "hoodie",
    description: "",
    compareAtPrice: "",
    price: "129",
    costPrice: "0",
    shippingRateAUD: "12",
    barcode: "",
    active: true,
    featured: false,
    bestSeller: false,
    newArrival: false,
    outfitSlot: "top",
    tags: "",
    mainImage: "",
    builderImage: "",
    images: "",
  });
  const [variantRows, setVariantRows] = useState([
    {
      id: crypto.randomUUID(),
      color: "Black",
      size: "M",
      stock: "5",
      sku: "",
      stockHolder: "",
      stockLocation: "",
      stockNotes: "",
    },
  ]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [colorImageGroups, setColorImageGroups] = useState<ProductColorImageGroup[]>([]);
  const [defaultVariantKey, setDefaultVariantKey] = useState("");

  const loadProducts = async () => {
    const response = await fetch("/api/admin/products", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await response.json();
    setProducts(data.products ?? []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const generateSlugFromName = () => {
    const generated = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setForm((prev) => ({ ...prev, slug: generated }));
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

  const onMainImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingMain(true);
      const [uploaded] = await uploadFiles(event.target.files);
      if (!uploaded) return;
      setForm((prev) => {
        const existing = prev.images
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return {
          ...prev,
          mainImage: uploaded,
          builderImage: uploaded,
          images: Array.from(new Set([uploaded, ...existing])).join("\n"),
        };
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Main image upload failed." });
    } finally {
      setUploadingMain(false);
      event.target.value = "";
    }
  };

  const onGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingGallery(true);
      const uploaded = await uploadFiles(event.target.files);
      if (!uploaded.length) return;
      setForm((prev) => {
        const existing = prev.images
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return { ...prev, images: Array.from(new Set([...existing, ...uploaded])).join("\n") };
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Gallery upload failed." });
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  };

  const removeGalleryImage = (imagePath: string) => {
    setForm((prev) => {
      const filtered = prev.images
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((image) => image !== imagePath);
      const nextMain = prev.mainImage === imagePath ? filtered[0] ?? "" : prev.mainImage;
      return {
        ...prev,
        mainImage: nextMain,
        builderImage: nextMain,
        images: filtered.join("\n"),
      };
    });
  };

  const updateColorGroup = (index: number, next: ProductColorImageGroup) => {
    setColorImageGroups((prev) => prev.map((group, i) => (i === index ? next : group)));
  };

  const removeColorGroup = (index: number) => {
    setColorImageGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const parsedVariants = useMemo(
    () =>
      variantRows
        .map((row) => ({
          color: row.color.trim() || "Default",
          size: row.size.trim(),
          price: Number(form.price || 0),
          stock: Number(row.stock || 0),
          sku:
            row.sku.trim() ||
            `${form.slug || "product"}-${(row.color || "default").toLowerCase().replace(/\s+/g, "-")}-${(row.size || "size").toLowerCase().replace(/\s+/g, "-")}`,
          stockHolder: row.stockHolder.trim() || null,
          stockLocation: row.stockLocation.trim() || null,
          stockNotes: row.stockNotes.trim() || null,
        }))
        .filter((variant) => variant.color && variant.size && variant.stock >= 0),
    [variantRows, form.price, form.slug]
  );

  const variantOptions = useMemo(
    () =>
      parsedVariants.map((variant) => ({
        key: getVariantKey(variant.color, variant.size),
        label: `${variant.color} / ${variant.size} - ${variant.stock} in stock`,
      })),
    [parsedVariants]
  );

  useEffect(() => {
    const committedColors = Array.from(
      new Set(
        variantRows
          .filter(
            (row) =>
              row.color.trim() &&
              row.size.trim() &&
              row.stock.trim() !== "" &&
              Number(row.stock) >= 0
          )
          .map((row) => row.color.trim())
      )
    );
    if (!committedColors.length) return;
    setColorImageGroups((prev) => {
      const byColor = new Map(prev.map((group) => [group.color.trim().toLowerCase(), group]));
      return committedColors.map(
        (color) =>
          byColor.get(color.toLowerCase()) ?? {
            color,
            mainImage: null,
            builderImage: null,
            galleryImages: [],
          }
      );
    });
  }, [variantRows]);

  useEffect(() => {
    if (!variantOptions.length) {
      setDefaultVariantKey("");
      return;
    }
    if (!defaultVariantKey || !variantOptions.some((option) => option.key === defaultVariantKey)) {
      const firstInStock = parsedVariants.find((variant) => variant.stock > 0);
      setDefaultVariantKey(
        firstInStock
          ? getVariantKey(firstInStock.color, firstInStock.size)
          : variantOptions[0].key
      );
    }
  }, [defaultVariantKey, parsedVariants, variantOptions]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const normalizedImages = Array.from(
      new Set(
        [
          form.mainImage.trim(),
          ...form.images
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        ].filter(Boolean)
      )
    );

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      brand: form.brand.trim() || "StreetVault",
      collection: form.collection.trim() || "Core",
      productType: form.productType.trim() || null,
      category: form.category,
      description: form.description.trim(),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      costPrice: Number(form.costPrice || 0),
      shippingRateAUD: Number(form.shippingRateAUD || 0),
      barcode: form.barcode.trim() || null,
      active: form.active,
      featured: form.featured,
      bestSeller: form.bestSeller,
      newArrival: form.newArrival,
      outfitSlot: form.outfitSlot,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      mainImage: form.mainImage.trim() || null,
      builderImage: form.mainImage.trim() || form.builderImage.trim() || null,
      images: normalizedImages,
      colorImageGroups: colorImageGroups
        .map((group) => ({
          color: group.color.trim(),
          mainImage: group.mainImage?.trim() || null,
          builderImage: group.builderImage?.trim() || null,
          galleryImages: Array.from(new Set((group.galleryImages ?? []).map((image) => image.trim()).filter(Boolean))),
        }))
        .filter((group) => group.color),
      defaultVariantKey: defaultVariantKey || null,
      variants: parsedVariants,
    };
    if (!payload.slug || !payload.name || payload.images.length === 0) {
      setMessage({ type: "error", text: "Slug, name, and at least one image are required." });
      return;
    }
    if (!payload.variants.length) {
      setMessage({ type: "error", text: "Add at least one variant with stock." });
      return;
    }

    const response = await fetch("/api/admin/products", {
      method: editingId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to save product." });
      return;
    }
    setMessage({ type: "success", text: editingId ? "Product updated." : "Product created." });
    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      slug: "",
      name: "",
      description: "",
      mainImage: "",
      builderImage: "",
      images: "",
      tags: "",
    }));
    setVariantRows([
      {
        id: crypto.randomUUID(),
        color: "Black",
        size: "M",
        stock: "5",
        sku: "",
        stockHolder: "",
        stockLocation: "",
        stockNotes: "",
      },
    ]);
    setColorImageGroups([]);
    setDefaultVariantKey("");
    await loadProducts();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Products</h2>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="mb-3 text-sm font-semibold">{editingId ? "Edit product" : "Add product"}</p>
        <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="Product name" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input value={form.slug} onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value }))} placeholder="Slug" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <button type="button" onClick={generateSlugFromName} className="rounded-lg border border-white/20 px-3 text-xs hover:bg-white/10">
              Auto
            </button>
          </div>
          <select value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={form.outfitSlot} onChange={(e) => setForm((v) => ({ ...v, outfitSlot: e.target.value }))} className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
            {["top", "bottom", "accessory"].map((slot) => (
              <option key={slot}>{slot}</option>
            ))}
          </select>
          <input value={form.brand} onChange={(e) => setForm((v) => ({ ...v, brand: e.target.value }))} placeholder="Brand" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.collection} onChange={(e) => setForm((v) => ({ ...v, collection: e.target.value }))} placeholder="Collection" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.productType} onChange={(e) => setForm((v) => ({ ...v, productType: e.target.value }))} placeholder="Product type (e.g. Zip-up Hoodie, Sneakers)" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
          <input value={form.price} onChange={(e) => setForm((v) => ({ ...v, price: e.target.value }))} placeholder="Price AUD" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.compareAtPrice} onChange={(e) => setForm((v) => ({ ...v, compareAtPrice: e.target.value }))} placeholder="Compare-at price (optional)" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.costPrice} onChange={(e) => setForm((v) => ({ ...v, costPrice: e.target.value }))} placeholder="Cost AUD" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.shippingRateAUD} onChange={(e) => setForm((v) => ({ ...v, shippingRateAUD: e.target.value }))} placeholder="Shipping AUD" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.barcode} onChange={(e) => setForm((v) => ({ ...v, barcode: e.target.value }))} placeholder="Barcode (optional)" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.tags} onChange={(e) => setForm((v) => ({ ...v, tags: e.target.value }))} placeholder="Tags (comma separated)" className="min-h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
          <textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Description" className="min-h-20 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm sm:col-span-2" />
          <div className="grid grid-cols-2 gap-2 text-xs sm:col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))} /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((v) => ({ ...v, featured: e.target.checked }))} /> Featured</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm((v) => ({ ...v, bestSeller: e.target.checked }))} /> Best seller</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.newArrival} onChange={(e) => setForm((v) => ({ ...v, newArrival: e.target.checked }))} /> New arrival</label>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-300">Main cover photo</p>
            {form.mainImage ? (
              <div className="relative h-32 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                <Image src={form.mainImage} alt="Main" fill sizes="300px" className="object-contain" />
              </div>
            ) : (
              <div className="grid h-32 place-items-center rounded-lg border border-dashed border-white/15 text-xs text-zinc-500">No main image</div>
            )}
            <input type="file" accept="image/png,image/webp,image/jpeg,image/jpg" onChange={onMainImageUpload} className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900" />
            {uploadingMain ? <p className="text-xs text-zinc-500">Uploading main image...</p> : null}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-300">Gallery uploads</p>
            <input type="file" multiple accept="image/png,image/webp,image/jpeg,image/jpg" onChange={onGalleryUpload} className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900" />
            {uploadingGallery ? <p className="text-xs text-zinc-500">Uploading gallery...</p> : null}
            <textarea value={form.images} onChange={(e) => setForm((v) => ({ ...v, images: e.target.value }))} placeholder="One image path per line" className="min-h-24 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs" />
          </div>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
            {form.images
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((imagePath) => (
                <div key={imagePath} className="rounded-lg border border-white/10 bg-black/30 p-2">
                  <div className="relative h-20 overflow-hidden rounded">
                    <Image src={imagePath} alt="Gallery" fill sizes="180px" className="object-contain" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, mainImage: imagePath, builderImage: imagePath }))} className="rounded border border-white/20 px-2 py-1 text-[11px]">Set main</button>
                    <button type="button" onClick={() => removeGalleryImage(imagePath)} className="rounded border border-red-400/50 px-2 py-1 text-[11px] text-red-200">Remove</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300">Color image groups</p>
            <button
              type="button"
              onClick={() =>
                setColorImageGroups((prev) => [
                  ...prev,
                  { color: "", mainImage: null, builderImage: null, galleryImages: [] },
                ])
              }
              className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
            >
              Add color group
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Define color-specific main, builder, and gallery images. Product-level images remain fallback.
          </p>
          <div className="grid gap-3">
            {colorImageGroups.map((group, index) => (
              <div key={`${group.color}-${index}`} className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={group.color}
                    onChange={(event) => updateColorGroup(index, { ...group, color: event.target.value })}
                    placeholder="Color name (e.g. Black, White, Grey)"
                    className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs"
                  />
                  <input
                    value={group.mainImage ?? ""}
                    onChange={(event) => updateColorGroup(index, { ...group, mainImage: event.target.value })}
                    placeholder="Main image path"
                    className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeColorGroup(index)}
                    className="rounded border border-red-400/50 px-3 py-1.5 text-xs text-red-200"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={group.builderImage ?? ""}
                    onChange={(event) => updateColorGroup(index, { ...group, builderImage: event.target.value })}
                    placeholder="Builder image path (optional)"
                    className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs"
                  />
                  <textarea
                    value={(group.galleryImages ?? []).join("\n")}
                    onChange={(event) =>
                      updateColorGroup(index, {
                        ...group,
                        galleryImages: event.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Gallery image paths (one per line)"
                    className="min-h-20 rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/jpg"
                    onChange={async (event) => {
                      try {
                        const [uploaded] = await uploadFiles(event.target.files);
                        if (!uploaded) return;
                        updateColorGroup(index, { ...group, mainImage: uploaded });
                      } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", text: "Color main image upload failed." });
                      } finally {
                        event.target.value = "";
                      }
                    }}
                    className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900"
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/webp,image/jpeg,image/jpg"
                    onChange={async (event) => {
                      try {
                        const uploaded = await uploadFiles(event.target.files);
                        if (!uploaded.length) return;
                        updateColorGroup(index, {
                          ...group,
                          galleryImages: Array.from(
                            new Set([...(group.galleryImages ?? []), ...uploaded])
                          ),
                        });
                      } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", text: "Color gallery upload failed." });
                      } finally {
                        event.target.value = "";
                      }
                    }}
                    className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-300">Variants (Color + Size + Stock)</p>
            <button
              type="button"
              onClick={() =>
                setVariantRows((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    color: "",
                    size: "",
                    stock: "0",
                    sku: "",
                    stockHolder: "",
                    stockLocation: "",
                    stockNotes: "",
                  },
                ])
              }
              className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
            >
              Add variant
            </button>
          </div>
          <div className="grid gap-2">
            {variantRows.map((row) => (
              <div key={row.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/30 p-2 sm:grid-cols-7">
                <input value={row.color} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, color: e.target.value } : it)))} placeholder="Color (e.g. Black, Navy, Triple Black)" className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                <input value={row.size} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, size: e.target.value } : it)))} placeholder="Size (e.g. S/M/L or US 8)" className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                <input value={row.stock} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, stock: e.target.value } : it)))} placeholder="Stock" className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                <input value={row.sku} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, sku: e.target.value } : it)))} placeholder="SKU (optional)" className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                <input value={row.stockHolder} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, stockHolder: e.target.value } : it)))} placeholder="Holder" className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                <input value={row.stockLocation} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, stockLocation: e.target.value } : it)))} placeholder="Location" className="rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                <div className="flex gap-2">
                  <input value={row.stockNotes} onChange={(e) => setVariantRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, stockNotes: e.target.value } : it)))} placeholder="Notes" className="w-full rounded-md border border-white/15 bg-black/30 px-2 py-2 text-xs" />
                  <button type="button" onClick={() => setVariantRows((prev) => prev.filter((it) => it.id !== row.id))} className="rounded border border-red-400/50 px-2 py-1 text-xs text-red-200">Remove</button>
                </div>
                <div className="sm:col-span-7 flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-2 py-2">
                  <span className="text-[11px] text-zinc-400">
                    {defaultVariantKey === getVariantKey(row.color, row.size)
                      ? "Default variant"
                      : "Not default"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDefaultVariantKey(getVariantKey(row.color, row.size))}
                    disabled={!row.color.trim() || !row.size.trim()}
                    className={`rounded px-2.5 py-1 text-[11px] ${
                      defaultVariantKey === getVariantKey(row.color, row.size)
                        ? "border border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                        : "border border-white/20 text-zinc-200 hover:bg-white/10"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Set as default
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Variant matrix preview</p>
            <div className="mt-2 grid gap-2">
              {Object.entries(
                parsedVariants.reduce<Record<string, typeof parsedVariants>>((acc, variant) => {
                  (acc[variant.color] ||= []).push(variant);
                  return acc;
                }, {})
              ).map(([color, variants]) => (
                <div key={color} className="rounded border border-white/10 bg-black/30 p-2 text-xs">
                  <p className="font-semibold text-zinc-200">{color}</p>
                  <p className="mt-1 text-zinc-400">
                    {variants.map((variant) => `${variant.size}: ${variant.stock}`).join(" | ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-2 sm:grid-cols-[auto_1fr] sm:items-center">
            <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Default variant</p>
            <select
              value={defaultVariantKey}
              onChange={(event) => setDefaultVariantKey(event.target.value)}
              className="rounded border border-white/20 bg-black/40 px-2 py-2 text-xs"
            >
              {variantOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
            {editingId ? "Update Product" : "Create Product"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm((prev) => ({ ...prev, slug: "", name: "", description: "", mainImage: "" }));
                setColorImageGroups([]);
                setDefaultVariantKey("");
              }}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
        {message ? (
          <p
            className={`mt-2 rounded-lg px-3 py-2 text-sm ${
              message.type === "success"
                ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </form>
      <p className="text-sm text-zinc-400">Catalog list with inventory and shipping visibility by product.</p>
      <div className="space-y-2">
        {products.map((product) => (
          <article key={product.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  <Image
                    src={product.mainImage ?? product.images[0]}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
                <div>
                <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-zinc-400">{product.slug}</p>
                  <p className="text-xs text-zinc-500">
                    {categoryLabel(product.category)} {product.productType ? `· ${product.productType}` : ""} ·{" "}
                    {product.active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                {formatPriceAUD(product.variants[0]?.price ?? 0)} from · {formatPriceAUD(product.shippingRateAUD ?? 0)} shipping/item
              </p>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Variants: {product.variants.length} · Colors: {new Set(product.variants.map((v) => v.color)).size} · In stock total: {product.variants.reduce((sum, v) => sum + v.stock, 0)} ·{" "}
              {product.variants.some((v) => v.stock > 0 && v.stock <= 3) ? "Low stock warning" : "Stock healthy"}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const first = product.variants[0] ?? null;
                  setEditingId(product.id);
                  setForm({
                    slug: product.slug,
                    name: product.name,
                    brand: product.brand ?? "StreetVault",
                    collection: product.collection ?? "Core",
                    productType: product.productType ?? "",
                    category: product.category,
                    description: product.description,
                    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
                    price: String(first?.price ?? 0),
                    costPrice: String(product.costPrice ?? 0),
                    shippingRateAUD: String(product.shippingRateAUD ?? 0),
                    barcode: product.barcode ?? "",
                    active: product.active,
                    featured: product.featured,
                    bestSeller: product.bestSeller,
                    newArrival: product.newArrival,
                    outfitSlot: product.outfitSlot,
                    tags: product.tags.join(","),
                    mainImage: product.mainImage ?? product.images[0] ?? "",
                    builderImage: product.builderImage ?? product.mainImage ?? "",
                    images: product.images.join("\n"),
                  });
                  setVariantRows(
                    product.variants.map((variant) => ({
                      id: variant.id,
                      color: variant.color,
                      size: variant.size,
                      stock: String(variant.stock),
                      sku: variant.sku ?? "",
                      stockHolder: variant.stockHolder ?? "",
                      stockLocation: variant.stockLocation ?? "",
                      stockNotes: variant.stockNotes ?? "",
                    }))
                  );
                  setColorImageGroups(product.colorImageGroups ?? []);
                  const inferredDefault =
                    product.defaultVariantKey ??
                    (first ? getVariantKey(first.color, first.size) : "");
                  setDefaultVariantKey(inferredDefault);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  const response = await fetch("/api/admin/products", {
                    method: "DELETE",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: product.id }),
                  });
                  if (!response.ok) {
                    setMessage({ type: "error", text: "Unable to delete product." });
                    return;
                  }
                  setMessage({ type: "success", text: "Product deleted." });
                  await loadProducts();
                }}
                className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

