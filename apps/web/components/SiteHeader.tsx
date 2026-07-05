import Link from "next/link";
import { Button } from "@mpf/ui";

const NAV = [
  ["Deals", "/deals"],
  ["Stores", "/stores"],
  ["Coupons", "/coupons"],
  ["Categories", "/deals"],
  ["Alerts", "/alerts"],
  ["Blog", "/blog"],
] as const;

export function SiteHeader() {
  return (
    <header className="flex items-center gap-5 border-b border-slate-200 bg-white px-5 py-3.5">
      <Link href="/" className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 text-white">
          M
        </span>
        MyPerkFinder
      </Link>
      <nav className="hidden gap-4 text-[13.5px] font-medium text-slate-600 md:flex">
        {NAV.map(([label, href]) => (
          <Link key={label} href={href} className="hover:text-brand-600">
            {label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
        <Button variant="primary" size="sm">
          ⇩ Install App
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="font-extrabold text-slate-900">MyPerkFinder</div>
        <p className="max-w-md">Deals, coupons &amp; perks in one place. Verified daily.</p>
        <p className="text-xs">
          Affiliate disclosure: MyPerkFinder may earn a commission from qualifying purchases made
          through links on this site.
        </p>
      </div>
    </footer>
  );
}
