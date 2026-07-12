import Link from "next/link";
import { BrandLogo, Button } from "@mpf/ui";

const NAV = [
  ["Deals", "/deals"],
  ["Stores", "/stores"],
  ["Coupons", "/coupons"],
  ["Categories", "/deals"],
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
    <header className="flex items-center gap-5 border-b border-slate-200 bg-white px-5 py-3.5">
      <Link href="/" className="inline-flex shrink-0" aria-label="MyPerkFinder home">
        <BrandLogo size={32} />
      </Link>
      <nav className="hidden gap-4 text-[13.5px] font-medium text-slate-600 md:flex">
        {NAV.map(([label, href]) => (
          <Link key={label} href={href} className="hover:text-brand-600">
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/about">
          <Button variant="ghost" size="sm">
            About
          </Button>
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        <div>
          <BrandLogo size={28} />
          <p className="mt-2 max-w-md">Deals, coupons &amp; perks in one place. Verified daily.</p>
          <p className="mt-3 text-xs leading-relaxed">
            <strong>Affiliate disclosure:</strong> MyPerkFinder may earn a commission from qualifying
            purchases made through links on this site.{" "}
            <Link href="/affiliate-disclosure" className="font-semibold text-brand-600 hover:underline">
              Read full disclosure
            </Link>
            .
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-slate-800">Legal &amp; support</div>
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
      <p className="mx-auto mt-6 max-w-6xl text-xs text-slate-400">
        © {new Date().getFullYear()} MyPerkFinder. All rights reserved.
      </p>
    </footer>
  );
}
