import Link from "next/link";
import { DealCard, DealGrid, StoreCard, Button, AffiliateDisclosure, EmptyState } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getDeals, getStores, toCard } from "@/lib/api";
import { EXPIRING_SOON_DAYS, isExpiringSoon } from "@/lib/expiry";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "Electronics", href: "/deals?category=electronics" },
  { label: "Audio", href: "/deals?category=audio" },
  { label: "Home & Kitchen", href: "/deals?category=home-kitchen" },
  { label: "Fashion", href: "/deals?category=fashion" },
  { label: "Coupons", href: "/coupons" },
] as const;

function chipClass() {
  return "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700";
}

export default async function HomePage() {
  const deals = await getDeals();
  const stores = await getStores();
  const best = deals.slice(0, 8);
  const expiring = [...deals]
    .filter((d) => isExpiringSoon(d.expiryDate, EXPIRING_SOON_DAYS))
    .sort(
      (a, b) =>
        new Date(a.expiryDate ?? 0).getTime() - new Date(b.expiryDate ?? 0).getTime()
    )
    .slice(0, 4);

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-brand-700 to-emerald-600 px-6 pb-14 pt-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100/90">MyPerkFinder</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Better deals, coupons &amp; perks — in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Browse verified offers from popular stores. Find the savings, then shop at the merchant.
          </p>
          <form
            action="/search"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-2 pl-4 shadow-lg"
          >
            <svg
              aria-hidden
              className="h-5 w-5 shrink-0 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              aria-label="Search deals"
              placeholder="Search laptops, headphones, stores…"
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
            />
            <Button type="submit" variant="primary" className="shrink-0 rounded-full px-5">
              Search
            </Button>
          </form>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/deals">
              <Button size="lg" className="rounded-full bg-white text-brand-800 hover:bg-teal-50">
                Browse deals
              </Button>
            </Link>
            <Link href="/coupons">
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full border border-white/40 text-white hover:bg-white/10"
              >
                View coupons
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-900">Browse by category</h2>
        <div className="mb-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.href} href={c.href} className={chipClass()}>
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Today&apos;s best deals</h2>
            <p className="text-sm text-slate-500">Fresh offers worth a look</p>
          </div>
          <Link href="/deals" className="text-sm font-bold text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {best.length > 0 ? (
          <DealGrid className="mb-12">
            {best.map((d) => (
              <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
            ))}
          </DealGrid>
        ) : (
          <div className="mb-12">
            <EmptyState
              title="No deals yet"
              description="We’re refreshing offers. Check back soon for the latest savings."
              action={
                <Link href="/stores">
                  <Button variant="primary">Browse stores</Button>
                </Link>
              }
            />
          </div>
        )}

        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Ending soon</h2>
            <p className="text-sm text-slate-500">Expires within {EXPIRING_SOON_DAYS} days</p>
          </div>
          <Link
            href="/deals?expiresSoon=true"
            className="text-sm font-bold text-brand-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        {expiring.length > 0 ? (
          <DealGrid className="mb-12">
            {expiring.map((d) => (
              <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
            ))}
          </DealGrid>
        ) : (
          <p className="mb-12 text-sm text-slate-500">
            No offers ending in the next {EXPIRING_SOON_DAYS} days.{" "}
            <Link href="/deals" className="font-semibold text-brand-600 hover:underline">
              Browse all deals
            </Link>
          </p>
        )}

        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Popular stores</h2>
            <p className="text-sm text-slate-500">Shop by brand you trust</p>
          </div>
          <Link href="/stores" className="text-sm font-bold text-brand-600 hover:underline">
            All stores →
          </Link>
        </div>
        {stores.length > 0 ? (
          <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
            {stores.slice(0, 12).map((s) => (
              <StoreCard key={s.slug} store={s} href={`/stores/${s.slug}`} />
            ))}
          </div>
        ) : (
          <p className="mb-10 text-sm text-slate-500">Stores will appear here as offers go live.</p>
        )}

        <AffiliateDisclosure />
      </main>

      <SiteFooter />
    </>
  );
}
