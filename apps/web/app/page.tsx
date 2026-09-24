import Link from "next/link";
import {
  DealCard,
  DealGrid,
  StoreCard,
  ButtonLink,
  AffiliateDisclosure,
  ChipLink,
  EmptyState,
  TrustBar,
  Icon,
  cn,
  focusRing,
  type IconName,
} from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { FeaturedDeal } from "@/components/FeaturedDeal";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SearchBox } from "@/components/SearchBox";
import { getDeals, getStores, getStats, getCategories, toCard } from "@/lib/api";
import { EXPIRING_SOON_DAYS } from "@/lib/expiry";

/**
 * Cannot be prerendered: Railway's private network is unavailable during builds, so a
 * build-time render cannot reach postgres.railway.internal. The database work is still
 * cached at runtime by unstable_cache in lib/api, so this costs render time, not queries.
 */
export const dynamic = "force-dynamic";

const CATEGORY_ICONS: IconName[] = ["bolt", "store", "tag", "coupon", "fire", "shield"];

/**
 * Section heading for the homepage rails: always an h2, always the same size, with the
 * "view all" affordance as a 44px target. The old version rendered `text-lg` headings and
 * a 20px-tall text link.
 */
function RailHeader({
  icon,
  title,
  subtitle,
  href,
  linkLabel,
  id,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
  id: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-brand-50 text-brand-700"
        >
          <Icon name={icon} size={18} />
        </span>
        <div className="min-w-0">
          <h2
            id={id}
            className="text-subhead font-extrabold tracking-tight text-ink-900 sm:text-xl"
          >
            {title}
          </h2>
          <p className="text-mini text-ink-600">{subtitle}</p>
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-control px-1 text-mini font-bold text-brand-700 hover:text-brand-800 hover:underline",
          focusRing
        )}
      >
        {linkLabel}
        <span className="sr-only"> — {title.toLowerCase()}</span>
        <Icon name="arrow-right" size={14} />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  /*
   * "Ending soon" is now its own indexed query. It used to be computed by filtering the
   * first page of newest deals in JavaScript, so a deal expiring tomorrow was invisible
   * unless it also happened to be among the 24 most recently imported — the rail was
   * usually either empty or wrong.
   *
   * `getStores(12)` / `getCategories(6)` push the limits into SQL instead of fetching
   * every merchant and category and slicing the result away.
   */
  const [deals, topDiscount, expiringSoon, stores, stats, categories] = await Promise.all([
    getDeals("?pageSize=8"),
    getDeals("?sort=highest_discount&pageSize=9"),
    getDeals("?expiresSoon=true&sort=ending_soon&pageSize=4"),
    getStores(12),
    getStats(),
    getCategories(6),
  ]);

  const featured = topDiscount.find((d) => d.imageUrl) ?? topDiscount[0] ?? deals[0];
  const best = deals.slice(0, 8);
  const biggest = topDiscount.filter((d) => d.slug !== featured?.slug).slice(0, 4);

  const nf = (n: number) => n.toLocaleString("en-US");

  return (
    <>
      <SiteHeader />

      {/* px-5 matches <main>; the hero used px-6, so the hero content sat 4px inside the
          rest of the page on every breakpoint. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-800 to-brand-700 px-5 pb-12 pt-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(45,212,191,0.35), transparent 42%), radial-gradient(circle at 82% 0%, rgba(249,115,22,0.22), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-mini font-bold uppercase tracking-[0.18em] text-brand-100">
            MyPerkFinder
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Better deals, coupons &amp; perks — in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ui text-white/90 sm:text-lg">
            Browse verified offers from popular stores. Find the savings, then shop at the merchant.
          </p>

          <div className="mx-auto mt-8 max-w-xl text-left">
            <SearchBox size="lg" placeholder="Search laptops, headphones, stores…" />
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {/* ButtonLink, not <Link><Button> — that nested a <button> inside an <a>,
                which is invalid HTML and gives the control two conflicting roles. */}
            <ButtonLink
              href="/deals"
              size="lg"
              className="rounded-pill bg-white text-brand-800 hover:bg-brand-50 focus-visible:ring-offset-brand-800"
            >
              Browse deals
            </ButtonLink>
            <ButtonLink
              href="/coupons"
              size="lg"
              variant="ghost"
              className="rounded-pill border border-white/50 text-white hover:bg-white/10 focus-visible:ring-offset-brand-800"
            >
              View coupons
            </ButtonLink>
          </div>

          <div className="mt-8 border-t border-white/15 pt-6 text-brand-50">
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

      <main id="main" className="mx-auto max-w-6xl px-5 py-10">
        {categories.length > 0 ? (
          <nav aria-label="Shop by category" className="mb-10">
            <ul className="flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <li key={c.slug}>
                  <ChipLink href={`/category/${c.slug}`}>
                    <Icon
                      name={CATEGORY_ICONS[i % CATEGORY_ICONS.length]!}
                      size={14}
                      className="text-brand-600"
                    />
                    {c.name}
                  </ChipLink>
                </li>
              ))}
              <li>
                <ChipLink href="/categories">
                  All categories
                  <Icon name="arrow-right" size={14} className="text-brand-600" />
                </ChipLink>
              </li>
            </ul>
          </nav>
        ) : null}

        {featured ? (
          <div className="mb-12">
            <FeaturedDeal deal={featured} href={`/deal/${featured.slug}`} />
          </div>
        ) : null}

        <section aria-labelledby="rail-best" className="mb-12">
          <RailHeader
            id="rail-best"
            icon="bolt"
            title="Today's best deals"
            subtitle="Fresh offers worth a look"
            href="/deals"
            linkLabel="View all"
          />
          {best.length > 0 ? (
            <DealGrid>
              {best.map((d, i) => (
                <DealCard
                  key={d.id}
                  deal={toCard(d)}
                  href={`/deal/${d.slug}`}
                  saveable
                  /* Above the fold on a phone once the hero scrolls; preloading the first
                     row is what moves LCP, preloading all eight would hurt it. */
                  priority={i < 2}
                />
              ))}
            </DealGrid>
          ) : (
            <EmptyState
              title="No deals yet"
              description="We’re refreshing offers. Check back soon for the latest savings."
              action={
                <ButtonLink href="/stores" variant="primary">
                  Browse stores
                </ButtonLink>
              }
            />
          )}
        </section>

        {biggest.length > 0 ? (
          <section aria-labelledby="rail-biggest" className="mb-12">
            <RailHeader
              id="rail-biggest"
              icon="fire"
              title="Biggest discounts"
              subtitle="The steepest markdowns right now"
              href="/deals?sort=highest_discount"
              linkLabel="View all"
            />
            <DealGrid>
              {biggest.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} saveable />
              ))}
            </DealGrid>
          </section>
        ) : null}

        <section aria-labelledby="rail-expiring" className="mb-12">
          <RailHeader
            id="rail-expiring"
            icon="clock"
            title="Ending soon"
            subtitle={`Expires within ${EXPIRING_SOON_DAYS} days`}
            href="/deals?expiresSoon=true"
            linkLabel="View all"
          />
          {expiringSoon.length > 0 ? (
            <DealGrid>
              {expiringSoon.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} saveable />
              ))}
            </DealGrid>
          ) : (
            <p className="text-card text-ink-600">
              No offers ending in the next {EXPIRING_SOON_DAYS} days.{" "}
              <Link
                href="/deals"
                className={cn("rounded-control font-semibold text-brand-700 underline", focusRing)}
              >
                Browse all deals
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="rail-stores" className="mb-12">
          <RailHeader
            id="rail-stores"
            icon="store"
            title="Top stores"
            subtitle="Retailers with the most active deals right now"
            href="/stores"
            linkLabel="All stores"
          />
          {stores.length > 0 ? (
            /* minmax(140px,…) rather than 160px: at a 320px viewport the old track could
               not fit two columns plus the gap, so tiles overflowed horizontally. */
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5">
              {stores.map((s) => (
                <li key={s.slug}>
                  <StoreCard store={s} href={`/stores/${s.slug}`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-card text-ink-600">Stores will appear here as offers go live.</p>
          )}
        </section>

        <div className="mb-10">
          <NewsletterSignup />
        </div>

        <AffiliateDisclosure />
      </main>

      <SiteFooter />
    </>
  );
}
