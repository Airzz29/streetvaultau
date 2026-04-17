import { BackNavButton } from "@/components/back-nav-button";

export default function ShippingPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl sm:p-7">
      <BackNavButton fallbackHref="/" label="Back" />
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">StreetVault Policy</p>
      <h1 className="text-3xl font-semibold">Shipping Policy</h1>
      <p className="text-sm text-zinc-300">
        At StreetVault, we aim to provide a reliable and transparent shipping experience. Please review
        our shipping policy before placing an order.
      </p>

      <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
        <div>
          <p className="font-semibold text-zinc-100">1. Processing Time</p>
          <p className="mt-1">
            Orders are typically processed within 1-3 business days after payment is confirmed.
            Processing time may be longer during high-demand periods, holidays, or unforeseen
            circumstances.
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">2. Shipping Methods & Delivery Times</p>
          <p className="mt-1">
            We ship worldwide using trusted couriers. Estimated delivery times are:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Domestic: 10-12 business days</li>
            <li>International: 12-30 business days</li>
          </ul>
          <p className="mt-2">Delivery times are estimates only and not guaranteed.</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">3. Customs & Import Duties</p>
          <p className="mt-1">
            Customers are responsible for ensuring that imported products are permitted in their country.
            We are not liable for customs delays, seizures, or additional taxes/fees charged by your
            local customs office.
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">4. Tracking</p>
          <p className="mt-1">
            Once your order has shipped, we provide a tracking number via email. Tracking updates may
            take 24-72 hours to appear online.
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">5. Shipping Costs</p>
          <p className="mt-1">
            Shipping rates are calculated at checkout based on location and order size. Customers are
            responsible for all shipping fees, including any re-delivery charges due to incorrect
            addresses.
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">6. Lost, Stolen, or Delayed Packages</p>
          <p className="mt-1">
            We are not responsible for packages lost, stolen, or delayed after being handed over to the
            shipping carrier. If a package is marked as delivered but not received, contact your local
            courier or postal service. For lost shipments, we may assist in filing a claim with the
            courier, but resolution is not guaranteed.
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-100">7. Incorrect or Incomplete Addresses</p>
          <p className="mt-1">
            Customers are responsible for providing accurate shipping information. Orders returned due to
            incorrect or incomplete addresses may be reshipped at the customer&apos;s expense.
          </p>
        </div>
      </div>
    </section>
  );
}
