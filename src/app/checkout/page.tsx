"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { useCart } from "@/context/cart-context";
import { formatPriceAUD } from "@/lib/utils";

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

export default function CheckoutPage() {
  const { items } = useCart();
  const validItems = useMemo(() => items, [items]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quote, setQuote] = useState<{
    subtotalAUD: number;
    shippingAUD: number;
    discountAmountAUD: number;
    totalAUD: number;
    discountCode: string | null;
  } | null>(null);
  const [readyForStripe, setReadyForStripe] = useState(false);
  const [newAddress, setNewAddress] = useState({
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
  const [useNewAddressForOrder, setUseNewAddressForOrder] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editDraft, setEditDraft] = useState({
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
    const response = await fetch("/api/account/addresses", { cache: "no-store" });
    const data = await response.json();
    const loaded = (data.addresses ?? []) as Address[];
    setAddresses(loaded);
    setAddressesLoaded(true);
    const defaultAddress = loaded.find((it) => it.isDefault)?.id ?? loaded[0]?.id ?? "";
    setSelectedAddressId((prev) => prev || defaultAddress);
  };

  useEffect(() => {
    if (addressesLoaded) return;
    loadAddresses().catch(() => {
      setAddressesLoaded(true);
    });
  }, [addressesLoaded]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("discount");
    const stored = window.localStorage.getItem("streetvault-discount-code");
    const initial = (fromQuery ?? stored ?? "").toUpperCase();
    if (initial) setDiscountCode(initial);
  }, []);

  const saveAddress = async () => {
    if (!newAddress.phone.trim()) {
      setQuoteError("Mobile number is required for shipping.");
      return;
    }
    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddress),
    });
    const data = await response.json();
    if (!response.ok) {
      setQuoteError(data.error ?? "Unable to save address.");
      return;
    }
    const loaded = (data.addresses ?? []) as Address[];
    setAddresses(loaded);
    const chosen = loaded.find((it) => it.isDefault)?.id ?? loaded[0]?.id ?? "";
    setSelectedAddressId(chosen);
    setUseNewAddressForOrder(false);
    setQuoteMessage("Address saved.");
  };

  const saveEditedAddress = async () => {
    if (!editingAddress) return;
    if (!editDraft.phone.trim()) {
      setQuoteError("Mobile number is required for shipping.");
      return;
    }
    const response = await fetch("/api/account/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingAddress.id, ...editDraft }),
    });
    const data = await response.json();
    if (!response.ok) {
      setQuoteError(data.error ?? "Unable to update address.");
      return;
    }
    setAddresses((data.addresses ?? []) as Address[]);
    setEditingAddress(null);
    setQuoteMessage("Address updated.");
  };

  const prepareCheckout = async () => {
    setQuoteError("");
    setQuoteMessage("");
    setReadyForStripe(false);
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
    const shouldUseManualAddress = useNewAddressForOrder || !selectedAddress;
    if (!shouldUseManualAddress && !selectedAddress?.phone?.trim()) {
      setQuoteError("Please add a mobile number to the selected delivery address.");
      return;
    }
    const response = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: validItems,
        addressId: shouldUseManualAddress ? undefined : selectedAddressId,
        shippingAddress: shouldUseManualAddress
          ? {
              firstName: newAddress.firstName,
              lastName: newAddress.lastName,
              addressLine1: newAddress.addressLine1,
              addressLine2: newAddress.addressLine2,
              city: newAddress.city,
              stateRegion: newAddress.stateRegion,
              postcode: newAddress.postcode,
              country: newAddress.country,
              phone: newAddress.phone,
            }
          : undefined,
        saveAddressForFuture: shouldUseManualAddress ? saveAddressForFuture : false,
        discountCode: discountCode.trim() || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setQuoteError(data.error ?? "Unable to prepare checkout.");
      return;
    }
    window.localStorage.setItem("streetvault-discount-code", (data.discountCode ?? discountCode).toUpperCase());
    setQuote(data);
    setReadyForStripe(true);
  };

  if (!validItems.length) {
    return (
      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5 text-center backdrop-blur-xl sm:p-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
        <p className="text-zinc-400">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
        >
          Browse Products
        </Link>
      </section>
    );
  }

  if (!stripePromise) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Checkout Unavailable</h1>
        <p className="text-zinc-400">
          Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local` and restart the app.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl sm:p-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Secure Checkout</h1>
      <p className="text-sm text-zinc-400">
        Payment is embedded on-site via Stripe Checkout.
      </p>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <h2 className="text-lg font-semibold">Delivery address</h2>
          {addresses.length ? (
            <div className="grid gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 p-3 text-sm">
                <input
                  type="radio"
                  checked={!useNewAddressForOrder}
                  onChange={() => setUseNewAddressForOrder(false)}
                />
                <span>Use a saved address</span>
              </label>
              {addresses.map((address) => (
                <label key={address.id} className="flex items-start gap-2 rounded-xl border border-white/10 p-3 text-sm">
                  <input
                    type="radio"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1"
                  />
                  <span>
                    {address.firstName} {address.lastName}
                    <br />
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                    <br />
                    {address.city}, {address.stateRegion} {address.postcode}
                    <br />
                    <span className="text-xs text-zinc-400">
                      Mobile: {address.phone?.trim() ? address.phone : "Missing - add before checkout"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setEditingAddress(address);
                      setEditDraft({
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
                    className="ml-auto rounded border border-white/20 px-2 py-1 text-xs"
                  >
                    Edit
                  </button>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No saved addresses yet. Add one below.</p>
          )}
          <label className="flex items-center gap-2 rounded-xl border border-white/10 p-3 text-sm">
            <input
              type="radio"
              checked={useNewAddressForOrder || !addresses.length}
              onChange={() => setUseNewAddressForOrder(true)}
            />
            <span>Use a new address for this order</span>
          </label>
          <p className="text-xs text-zinc-400">
            You can checkout directly with the form below. Saving the address is optional.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={newAddress.firstName} onChange={(e) => setNewAddress((v) => ({ ...v, firstName: e.target.value }))} placeholder="First name" autoComplete="given-name" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <input value={newAddress.lastName} onChange={(e) => setNewAddress((v) => ({ ...v, lastName: e.target.value }))} placeholder="Last name" autoComplete="family-name" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <input value={newAddress.addressLine1} onChange={(e) => setNewAddress((v) => ({ ...v, addressLine1: e.target.value }))} placeholder="Address line 1" autoComplete="address-line1" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
            <input value={newAddress.addressLine2} onChange={(e) => setNewAddress((v) => ({ ...v, addressLine2: e.target.value }))} placeholder="Address line 2 (optional)" autoComplete="address-line2" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
            <input value={newAddress.city} onChange={(e) => setNewAddress((v) => ({ ...v, city: e.target.value }))} placeholder="City" autoComplete="address-level2" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <input value={newAddress.stateRegion} onChange={(e) => setNewAddress((v) => ({ ...v, stateRegion: e.target.value }))} placeholder="State/region" autoComplete="address-level1" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <input value={newAddress.postcode} onChange={(e) => setNewAddress((v) => ({ ...v, postcode: e.target.value }))} placeholder="Postcode" autoComplete="postal-code" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <input value={newAddress.country} onChange={(e) => setNewAddress((v) => ({ ...v, country: e.target.value }))} placeholder="Country" autoComplete="country-name" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
            <input value={newAddress.phone} onChange={(e) => setNewAddress((v) => ({ ...v, phone: e.target.value }))} placeholder="Mobile number (required)" autoComplete="tel" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={saveAddressForFuture}
              onChange={(event) => setSaveAddressForFuture(event.target.checked)}
            />
            Save this address for faster future purchases
          </label>
          <p className="text-xs text-zinc-500">
            If enabled, this address will be available next time so checkout is quicker.
          </p>
          <button onClick={saveAddress} className="min-h-11 w-full rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10 sm:w-auto">
            Save Address
          </button>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="mb-2 text-sm font-medium">Discount code</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                placeholder="Enter code"
                className="min-h-11 w-full flex-1 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"
              />
              <button onClick={prepareCheckout} className="min-h-11 rounded-lg bg-zinc-100 px-3 text-sm font-semibold text-zinc-900">
                Apply
              </button>
            </div>
            {quote ? (
              <div className="mt-2 space-y-1 text-sm text-zinc-300">
                <p>Subtotal: {formatPriceAUD(quote.subtotalAUD)}</p>
                <p>Shipping: {formatPriceAUD(quote.shippingAUD)}</p>
                <p className={quote.discountAmountAUD > 0 ? "text-emerald-300" : ""}>
                  Discount: -{formatPriceAUD(quote.discountAmountAUD)}
                </p>
                <p className="font-semibold">Total: {formatPriceAUD(quote.totalAUD)}</p>
                {quote.discountCode ? (
                  <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                    Code applied: {quote.discountCode} · You saved {formatPriceAUD(quote.discountAmountAUD)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {!readyForStripe ? (
            <button onClick={prepareCheckout} className="min-h-12 w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
              Continue to Payment
            </button>
          ) : null}
          {quoteError ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{quoteError}</p> : null}
          {quoteMessage ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{quoteMessage}</p> : null}
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-white p-1.5 sm:p-2">
          {readyForStripe ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                fetchClientSecret: async () => {
                  const response = await fetch("/api/checkout/embedded", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      items: validItems,
                      addressId:
                        useNewAddressForOrder || !addresses.find((address) => address.id === selectedAddressId)
                          ? undefined
                          : selectedAddressId,
                      shippingAddress:
                        useNewAddressForOrder || !addresses.find((address) => address.id === selectedAddressId)
                          ? {
                              firstName: newAddress.firstName,
                              lastName: newAddress.lastName,
                              addressLine1: newAddress.addressLine1,
                              addressLine2: newAddress.addressLine2,
                              city: newAddress.city,
                              stateRegion: newAddress.stateRegion,
                              postcode: newAddress.postcode,
                              country: newAddress.country,
                              phone: newAddress.phone,
                            }
                          : undefined,
                      saveAddressForFuture:
                        useNewAddressForOrder || !addresses.find((address) => address.id === selectedAddressId)
                          ? saveAddressForFuture
                          : false,
                      discountCode: discountCode.trim() || undefined,
                    }),
                  });

                  const data = await response.json();
                  if (!response.ok || !data.clientSecret) {
                    throw new Error(
                      data.error ?? "Failed to initialize embedded checkout."
                    );
                  }
                  return data.clientSecret as string;
                },
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div className="grid min-h-[420px] place-items-center p-6 text-center text-sm text-zinc-600">
              Select delivery details and continue to payment to load Stripe checkout.
            </div>
          )}
        </div>
      </div>
      {editingAddress ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit delivery address</h3>
              <button onClick={() => setEditingAddress(null)} className="rounded border border-white/20 px-2 py-1 text-xs">Close</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={editDraft.firstName} onChange={(e) => setEditDraft((v) => ({ ...v, firstName: e.target.value }))} placeholder="First name" autoComplete="given-name" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
              <input value={editDraft.lastName} onChange={(e) => setEditDraft((v) => ({ ...v, lastName: e.target.value }))} placeholder="Last name" autoComplete="family-name" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
              <input value={editDraft.addressLine1} onChange={(e) => setEditDraft((v) => ({ ...v, addressLine1: e.target.value }))} placeholder="Address line 1" autoComplete="address-line1" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
              <input value={editDraft.addressLine2} onChange={(e) => setEditDraft((v) => ({ ...v, addressLine2: e.target.value }))} placeholder="Address line 2" autoComplete="address-line2" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
              <input value={editDraft.city} onChange={(e) => setEditDraft((v) => ({ ...v, city: e.target.value }))} placeholder="City" autoComplete="address-level2" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
              <input value={editDraft.stateRegion} onChange={(e) => setEditDraft((v) => ({ ...v, stateRegion: e.target.value }))} placeholder="State/region" autoComplete="address-level1" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
              <input value={editDraft.postcode} onChange={(e) => setEditDraft((v) => ({ ...v, postcode: e.target.value }))} placeholder="Postcode" autoComplete="postal-code" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
              <input value={editDraft.country} onChange={(e) => setEditDraft((v) => ({ ...v, country: e.target.value }))} placeholder="Country" autoComplete="country-name" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm" />
              <input value={editDraft.phone} onChange={(e) => setEditDraft((v) => ({ ...v, phone: e.target.value }))} placeholder="Mobile number (required)" autoComplete="tel" className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm sm:col-span-2" />
            </div>
            <button onClick={saveEditedAddress} className="mt-3 min-h-11 w-full rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 sm:w-auto">
              Save changes
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
