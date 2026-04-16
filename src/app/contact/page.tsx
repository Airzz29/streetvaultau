"use client";

import { FormEvent, useEffect, useState } from "react";
import { BackNavButton } from "@/components/back-nav-button";

export default function ContactPage() {
  const [orderContext, setOrderContext] = useState<{ orderId: string; product: string }>({
    orderId: "",
    product: "",
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId") ?? "";
    const product = params.get("product") ?? "";
    if (!orderId) return;
    setOrderContext({ orderId, product });
    setForm((prev) => ({
      ...prev,
      subject: prev.subject || `Order support ${orderId}`,
      message:
        prev.message ||
        `Hi StreetVault team, I need help with order #${orderId.slice(0, 8)}${
          product ? ` regarding ${product}` : ""
        }.`,
    }));
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("idle");
    setError("");
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sourceType: orderContext.orderId ? "order" : "general",
        orderId: orderContext.orderId || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus("error");
      setError(data.error ?? "Unable to send your message.");
      return;
    }
    setStatus("success");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-7">
      <BackNavButton fallbackHref="/" label="Back" />
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">StreetVault Support</p>
      <h1 className="text-3xl font-semibold">Contact Us</h1>
      <p className="text-sm text-zinc-400">
        Send us your question and we will review it in our operations inbox.
      </p>
      <p className="text-sm text-zinc-400">
        Follow updates on{" "}
        <a
          href="https://instagram.com/streetvault"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-200 underline decoration-white/30 underline-offset-2"
        >
          Instagram
        </a>
        .
      </p>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="Name" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" required />
          <input value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} type="email" placeholder="Email" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" required />
          <input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} placeholder="Phone (optional)" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.subject} onChange={(e) => setForm((v) => ({ ...v, subject: e.target.value }))} placeholder="Subject (optional)" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
        </div>
        <textarea value={form.message} onChange={(e) => setForm((v) => ({ ...v, message: e.target.value }))} placeholder="How can we help?" className="min-h-36 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm" required />
        <button className="min-h-11 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 hover:bg-white">
          Send Message
        </button>
      </form>
      {status === "success" ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Thanks — your message has been received. We will respond by email.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}

