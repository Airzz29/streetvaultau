import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AccountLogoutButton } from "@/components/account-logout-button";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user) {
    redirect("/login?next=/account");
  }
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">My Account</h1>
            <p className="text-sm text-zinc-400">
              {user.firstName} {user.lastName} - {user.email}
            </p>
          </div>
          <AccountLogoutButton />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/account" className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10">
            Overview
          </Link>
          <Link href="/account/orders" className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10">
            Orders
          </Link>
          <Link href="/account/profile" className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10">
            Profile
          </Link>
          <Link href="/account/addresses" className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10">
            Addresses
          </Link>
          <Link href="/account/reviews" className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/10">
            Reviews
          </Link>
        </div>
      </div>
      {children}
    </section>
  );
}

