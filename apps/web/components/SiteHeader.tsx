import Link from "next/link";
import { BrandLogo, Button } from "@mpf/ui";
import { MobileNav } from "@/components/MobileNav";

const NAV = [
  ["Deals", "/deals"],
  ["Stores", "/stores"],
  ["Coupons", "/coupons"],
] as const;

const FOOTER_LINKS = [
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms of Service", "/terms"],
  ["Affiliate Disclosure", "/affiliate-disclosure"],
] as const;

export function SiteHeader() {
  return (
    <header className="relative z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-3.5">
        <Link href="/" className="inline-flex shrink-0" aria-label="MyPerkFinder home">
          <BrandLogo size={32} />
        </Link>
        <nav className="hidden gap-5 text-[13.5px] font-semibold text-slate-600 md:flex">
          {NAV.map(([label, href]) => (
            <Link key={label} href={href} className="transition hover:text-brand-600">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Search
            </Button>
          </Link>
          <Link href="/deals" className="hidden md:block">
            <Button variant="primary" size="sm">
              Browse deals
            </Button>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo size={28} />
          <p className="mt-3 max-w-md leading-relaxed">
            Find verified deals, coupons, and store promotions from retailers you know — updated
            regularly.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            <strong className="text-slate-500">Affiliate disclosure:</strong> MyPerkFinder may earn a
            commission from qualifying purchases made through links on this site.{" "}
            <Link href="/affiliate-disclosure" className="font-semibold text-brand-600 hover:underline">
              Read full disclosure
            </Link>
            .
          </p>
        </div>
        <div>
          <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-800">Explore</div>
          <ul className="space-y-1.5">
            {NAV.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-brand-600">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className="hover:text-brand-600">
                Search
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-800">
            Legal &amp; support
          </div>
          <ul className="space-y-1.5">
            {FOOTER_LINKS.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-brand-600">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-slate-400">
        © {new Date().getFullYear()} MyPerkFinder. Operated by Elucent. All rights reserved.
      </p>
    </footer>
  );
}
