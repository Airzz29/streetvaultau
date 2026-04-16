import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { SiteBackground } from "@/components/site-background";
import { CartAddToast } from "@/components/cart-add-toast";
import { requireUser } from "@/lib/auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "StreetVault | Premium Streetwear",
  description:
    "StreetVault brings best quality clothes and shoes with 1-3 day express shipping in Australia only.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    user = await requireUser();
  } catch (error) {
    const description =
      error && typeof error === "object" && "description" in error
        ? String((error as { description?: unknown }).description ?? "")
        : "";
    const isExpectedDynamicUsage = description.includes("DYNAMIC_SERVER_USAGE");
    if (!isExpectedDynamicUsage) {
      console.error("Failed to resolve user session in RootLayout", error);
    }
    user = null;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative bg-transparent text-zinc-100 antialiased`}
      >
        <CartProvider>
          <SiteBackground />
          <div className="relative z-[20] flex min-h-screen flex-col">
            <SiteHeader initialLoggedIn={Boolean(user)} />
            <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
              {children}
            </main>
            <Footer />
          </div>
          <CartAddToast />
        </CartProvider>
      </body>
    </html>
  );
}
