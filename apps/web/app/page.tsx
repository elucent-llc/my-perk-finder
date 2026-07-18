import Link from "next/link";
import {
  DealCard,
  DealGrid,
  StoreCard,
  Button,
  AffiliateDisclosure,
  EmptyState,
  TrustBar,
  Icon,
  type IconName,
} from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { FeaturedDeal } from "@/components/FeaturedDeal";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getDeals, getStores, getStats, toCard } from "@/lib/api";
import { EXPIRING_SOON_DAYS, isExpiringSoon } from "@/lib/expiry";

export const dynamic = "force-dynamic";

const CATEGORIES: { label: string; href: string; icon: IconName }[] = [
  { label: "Electronics", href: "/deals?category=electronics", icon: "bolt" },
  { label: "Audio", href: "/deals?category=audio", icon: "bolt" },
  { label: "Home & Kitchen", href: "/deals?category=home-kitchen", icon: "store" },
  { label: "Fashion", href: "/deals?category=fashion", icon: "tag" },
  { label: "Coupons", href: "/coupons", icon: "coupon" },
];

function SectionHeader({
  icon,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={icon} size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink-800">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
      >
        {linkLabel}
        <Icon name="arrow-right" size={14} />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [deals, topDiscount, stores, stats] = await Promise.all([
    getDeals(),
    getDeals("?sort=highest_discount&pageSize=9"),
    getStores(),
    getStats(),
  ]);

  const featured = topDiscount.find((d) => d.imageUrl) ?? topDiscount[0] ?? deals[0];
  const best = deals.slice(0, 8);
  const biggest = topDiscount.filter((d) => d.slug !== featured?.slug).slice(0, 4);
  const expiring = [...deals]
    .filter((d) => isExpiringSoon(d.expiryDate, EXPIRING_SOON_DAYS))
    .sort(
      (a, b) => new Date(a.expiryDate ?? 0).getTime() - new Date(b.expiryDate ?? 0).getTime()
    )
    .slice(0, 4);

  const nf = (n: number) => n.toLocaleString("en-US");

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-800 to-brand-600 px-6 pb-12 pt-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(45,212,191,0.35), transparent 42%), radial-gradient(circle at 82% 0%, rgba(249,115,22,0.22), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100/90">
            MyPerkFinder
          </p>
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
            <Icon name="search" size={20} className="shrink-0 text-slate-400" />
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

          <div className="mt-8 border-t border-white/15 pt-6 text-teal-50">
            <TrustBar
              items={[
                { icon: "tag", value: `${nf(stats.activeDeals)}`, label: "live deals" },
                { icon: "store", value: `${nf(stats.stores)}`, label: "stores" },
                { icon: "coupon", value: `${nf(stats.coupons)}`, label: "coupons" },
                { icon: "shield", label: "Verified & updated daily" },
              ]}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
            >
              <Icon name={c.icon} size={14} className="text-brand-500" />
              {c.label}
            </Link>
          ))}
        </div>

        {featured ? (
          <div className="mb-12">
            <FeaturedDeal deal={featured} href={`/deal/${featured.slug}`} />
          </div>
        ) : null}

        <SectionHeader
          icon="bolt"
          title="Today's best deals"
          subtitle="Fresh offers worth a look"
          href="/deals"
          linkLabel="View all"
        />
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

        {biggest.length > 0 ? (
          <>
            <SectionHeader
              icon="fire"
              title="Biggest discounts"
              subtitle="The steepest markdowns right now"
              href="/deals?sort=highest_discount"
              linkLabel="View all"
            />
            <DealGrid className="mb-12">
              {biggest.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
              ))}
            </DealGrid>
          </>
        ) : null}

        <SectionHeader
          icon="clock"
          title="Ending soon"
          subtitle={`Expires within ${EXPIRING_SOON_DAYS} days`}
          href="/deals?expiresSoon=true"
          linkLabel="View all"
        />
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

        <SectionHeader
          icon="store"
          title="Top stores"
          subtitle="Retailers with the most active deals right now"
          href="/stores"
          linkLabel="All stores"
        />
        {stores.length > 0 ? (
          <div className="mb-12 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
            {stores.slice(0, 12).map((s) => (
              <StoreCard key={s.slug} store={s} href={`/stores/${s.slug}`} />
            ))}
          </div>
        ) : (
          <p className="mb-12 text-sm text-slate-500">Stores will appear here as offers go live.</p>
        )}

        <div className="mb-10">
          <NewsletterSignup />
        </div>

        <AffiliateDisclosure />
      </main>

      <SiteFooter />
    </>
  );
}
