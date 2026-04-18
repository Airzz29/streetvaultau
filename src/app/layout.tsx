import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { CurrencyProvider } from "@/context/currency-context";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { SiteBackground } from "@/components/site-background";
import { CartAddToast } from "@/components/cart-add-toast";
import { resolveAppBaseUrl } from "@/lib/app-url";

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
  title: "StreetVault Australia | Premium Streetwear Store",
  description:
    "StreetVault brings best quality clothes and shoes with 1-3 day express shipping in Australia only.",
  metadataBase: new URL(resolveAppBaseUrl()),
  alternates: {
    canonical: "/",
    languages: {
      "en-AU": "/",
      en: "/",
    },
  },
  openGraph: {
    title: "StreetVault | Premium Streetwear",
    description:
      "StreetVault brings best quality clothes and shoes with 1-3 day express shipping in Australia only.",
    url: "/",
    siteName: "StreetVault",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreetVault | Premium Streetwear",
    description:
      "StreetVault brings best quality clothes and shoes with 1-3 day express shipping in Australia only.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#0a0a0b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appBaseUrl = resolveAppBaseUrl();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StreetVault",
    url: appBaseUrl,
    logo: `${appBaseUrl}/favicon.ico`,
    sameAs: [
      "https://instagram.com/streetvault",
      "https://x.com/streetvault",
      "https://facebook.com/streetvault",
      "https://youtube.com/@streetvault",
      "https://linkedin.com/company/streetvault",
    ],
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "StreetVault",
    url: appBaseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${appBaseUrl}/shop?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative bg-transparent text-zinc-100 antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <CartProvider>
          <CurrencyProvider>
            <SiteBackground />
            <div className="relative z-[20] flex min-h-screen flex-col">
              <SiteHeader />
              <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
                {children}
              </main>
              <Footer />
            </div>
            <CartAddToast />
          </CurrencyProvider>
        </CartProvider>
      </body>
    </html>
  );
}
