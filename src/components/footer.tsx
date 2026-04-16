import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/15 py-8 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 text-xs text-zinc-400 sm:grid-cols-3 sm:px-6 lg:px-8">
        <p>StreetVault</p>
        <p className="text-center">
          Best quality clothes & shoes ·{" "}
          <Link href="/contact" className="text-zinc-300 hover:text-zinc-100">
            Contact Us
          </Link>
          {" · "}
          <a
            href="https://instagram.com/streetvault"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-zinc-100"
          >
            Instagram
          </a>
        </p>
        <p className="text-right">1-3 day express shipping (Australia only)</p>
      </div>
    </footer>
  );
}
