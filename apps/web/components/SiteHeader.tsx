import Link from "next/link";
import { BrandLogo, Icon, cn, focusRing } from "@mpf/ui";
import { MobileNav } from "@/components/MobileNav";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { HeaderNav } from "@/components/HeaderNav";
import { NAV_ITEMS, FOOTER_LINKS } from "@/components/nav-items";

const footerLink = cn("inline-flex min-h-[40px] items-center rounded-control px-1 hover:text-brand-700 hover:underline", focusRing);

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5 sm:gap-5">
        <Link
          href="/"
          className={cn("inline-flex shrink-0 rounded-control p-1", focusRing)}
          aria-label="MyPerkFinder home"
        >
          <BrandLogo size={32} />
        </Link>

        <HeaderNav />

        <div className="ml-auto flex items-center gap-2">
          {/*
            Search is the primary task on a deals site, so it gets a real
            affordance at every width. Previously it was `hidden sm:block`
            and absent from the mobile drawer, making site search unreachable
            from the header on a phone.
          */}
          <Link
            href="/search"
            aria-label="Search deals"
            className={cn(
              "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-control px-3 text-card font-semibold text-ink-600 transition hover:bg-slate-100 hover:text-brand-700",
              focusRing
            )}
          >
            <Icon name="search" size={18} />
            <span className="hidden sm:inline">Search</span>
          </Link>

          <Link
            href="/deals"
            className={cn(
              "hidden min-h-[44px] items-center rounded-control bg-brand-700 px-4 text-card font-semibold text-white transition hover:bg-brand-800 md:inline-flex",
              focusRing
            )}
          >
            Browse deals
          </Link>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white px-5 py-10 text-sm text-ink-500">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo size={28} />
          <p className="mt-3 max-w-md leading-relaxed">
            Find verified deals, coupons, and store promotions from retailers you know — updated
            regularly.
          </p>
          <div className="mt-4 max-w-sm">
            {/* Headings, not styled divs — the footer was absent from the
                document outline entirely. */}
            <h2 className="mb-2 text-xs font-bold tracking-wide text-ink-800">Get deal alerts</h2>
            <NewsletterSignup variant="compact" />
          </div>
          <p className="mt-4 text-xs leading-relaxed">
            <strong className="font-semibold text-ink-700">Affiliate disclosure:</strong>{" "}
            MyPerkFinder may earn a commission from qualifying purchases made through links on this
            site.{" "}
            <Link href="/affiliate-disclosure" className={cn("font-semibold text-brand-700 hover:underline", focusRing)}>
              Read full disclosure
            </Link>
            .
          </p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="mb-1.5 text-xs font-bold tracking-wide text-ink-800">
            Explore
          </h2>
          <ul>
            {NAV_ITEMS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={footerLink}>
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/search" className={footerLink}>
                Search
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal">
          <h2 id="footer-legal" className="mb-1.5 text-xs font-bold tracking-wide text-ink-800">
            Legal &amp; support
          </h2>
          <ul>
            {FOOTER_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={footerLink}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs">
        © {new Date().getFullYear()} MyPerkFinder. Operated by Elucent. All rights reserved.
      </p>
    </footer>
  );
}
