import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/25 py-10 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 text-sm text-zinc-400 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-md border border-white/15 bg-black/30">
            <Image src="/favicon.ico" alt="StreetVault logo" fill sizes="32px" className="object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">StreetVault</p>
            <p className="text-xs text-zinc-500">Premium streetwear store</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
          <Link href="/contact" className="text-zinc-300 hover:text-zinc-100">
            Contact Us
          </Link>
          <Link href="/policy" className="text-zinc-300 hover:text-zinc-100">
            Refund / Return Policy
          </Link>
          <Link href="/shipping-policy" className="text-zinc-300 hover:text-zinc-100">
            Shipping Policy
          </Link>
          <a
            href="https://instagram.com/streetvault"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-zinc-100"
          >
            Instagram
          </a>
          <a href="https://x.com/streetvault" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-zinc-100">
            X / Twitter
          </a>
          <a href="https://facebook.com/streetvault" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-zinc-100">
            Facebook
          </a>
          <a href="https://youtube.com/@streetvault" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-zinc-100">
            YouTube
          </a>
          <a href="https://linkedin.com/company/streetvault" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-zinc-100">
            LinkedIn
          </a>
        </div>
        <p className="text-right text-xs sm:text-sm">1-3 day express shipping (Australia only)</p>
      </div>
    </footer>
  );
}
