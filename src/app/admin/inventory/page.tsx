"use client";

import { useEffect, useMemo, useState } from "react";
import { InventoryLog, ProductWithVariants } from "@/types/product";

export default function AdminInventoryRoute() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [threshold, setThreshold] = useState(3);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products", { cache: "no-store", credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/inventory/logs", { cache: "no-store", credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/settings", { cache: "no-store", credentials: "include" }).then((r) => r.json()),
    ]).then(([p, l, s]) => {
      setProducts(p.products ?? []);
      setLogs(l.logs ?? []);
      setThreshold(s.lowStockThreshold ?? 3);
    });
  }, []);

  const lowStock = useMemo(
    () =>
      products.flatMap((product) =>
        product.variants
          .filter((variant) => variant.stock <= (variant.lowStockThreshold ?? threshold))
          .map((variant) => ({ productName: product.name, size: variant.size, stock: variant.stock }))
      ),
    [products, threshold]
  );

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Inventory</h2>
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-lg font-semibold">Low Stock</h3>
        <div className="mt-3 grid gap-2">
          {lowStock.map((line) => (
            <div key={`${line.productName}-${line.size}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
              {line.productName} · Size {line.size} · Qty {line.stock}
            </div>
          ))}
          {lowStock.length === 0 ? <p className="text-sm text-zinc-500">No low-stock lines currently.</p> : null}
        </div>
      </article>
      <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-lg font-semibold">Movement History</h3>
        <div className="mt-3 grid gap-2">
          {logs.slice(0, 25).map((log) => (
            <div key={log.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
              <p className="font-semibold">{log.productName}</p>
              <p className="text-zinc-400">{log.change > 0 ? "+" : ""}{log.change} · {log.variantLabel} · {log.reason}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

