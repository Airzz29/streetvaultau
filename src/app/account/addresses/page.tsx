"use client";

import { FormEvent, useEffect, useState } from "react";

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateRegion: string;
  postcode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateRegion: "",
    postcode: "",
    country: "Australia",
    phone: "",
    isDefault: false,
  });

  const loadAddresses = async () => {
    const response = await fetch("/api/account/addresses");
    const data = await response.json();
    setAddresses(data.addresses ?? []);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/account/addresses", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to save address.");
      return;
    }
    setAddresses(data.addresses ?? []);
    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateRegion: "",
      postcode: "",
    }));
    setMessage(editingId ? "Address updated." : "Address saved.");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Saved addresses</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <article key={address.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
            <p className="font-semibold">
              {address.firstName} {address.lastName}
            </p>
            <p className="text-zinc-400">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""}
            </p>
            <p className="text-zinc-400">
              {address.city}, {address.stateRegion} {address.postcode}
            </p>
            <p className="text-zinc-400">{address.country}</p>
            {address.isDefault ? <p className="mt-1 text-xs text-emerald-300">Default</p> : null}
            <button
              type="button"
              onClick={() => {
                setEditingId(address.id);
                setForm({
                  firstName: address.firstName,
                  lastName: address.lastName,
                  addressLine1: address.addressLine1,
                  addressLine2: address.addressLine2 ?? "",
                  city: address.city,
                  stateRegion: address.stateRegion,
                  postcode: address.postcode,
                  country: address.country,
                  phone: address.phone ?? "",
                  isDefault: address.isDefault,
                });
              }}
              className="mt-2 rounded border border-white/20 px-2 py-1 text-xs"
            >
              Edit
            </button>
          </article>
        ))}
      </div>
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="mb-3 text-sm font-semibold">{editingId ? "Edit address" : "Add address"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input required value={form.firstName} onChange={(e) => setForm((v) => ({ ...v, firstName: e.target.value }))} placeholder="First name" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input required value={form.lastName} onChange={(e) => setForm((v) => ({ ...v, lastName: e.target.value }))} placeholder="Last name" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input required value={form.addressLine1} onChange={(e) => setForm((v) => ({ ...v, addressLine1: e.target.value }))} placeholder="Address line 1" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
          <input value={form.addressLine2} onChange={(e) => setForm((v) => ({ ...v, addressLine2: e.target.value }))} placeholder="Address line 2 (optional)" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
          <input required value={form.city} onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))} placeholder="City / suburb" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input required value={form.stateRegion} onChange={(e) => setForm((v) => ({ ...v, stateRegion: e.target.value }))} placeholder="State / region" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input required value={form.postcode} onChange={(e) => setForm((v) => ({ ...v, postcode: e.target.value }))} placeholder="Postcode" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input required value={form.country} onChange={(e) => setForm((v) => ({ ...v, country: e.target.value }))} placeholder="Country" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm" />
          <input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} placeholder="Phone (optional)" className="min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
          <input checked={form.isDefault} onChange={(e) => setForm((v) => ({ ...v, isDefault: e.target.checked }))} type="checkbox" />
          Set as default
        </label>
        <button className="mt-3 min-h-11 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-900">
          {editingId ? "Update address" : "Save address"}
        </button>
        {message ? <p className="mt-2 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </section>
  );
}

