import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChipLink,
  DealCard,
  DealGrid,
  CouponCard,
  StoreCard,
  EmptyState,
  Badge,
  ButtonLink,
  Panel,
  PanelHead,
  PanelBody,
  AffiliateDisclosure,
  Icon,
  cn,
  focusRing,
  logoNeedsUnoptimized,
  resolveStoreLogoUrl,
} from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { getStore, toCard, expiryLabel, offerRedirectUrl } from "@/lib/api";
import { buildMetadata, breadcrumbLd, monthYear } from "@/lib/seo";

/** Store pages are an SEO surface and change with the importer, not per request. */
export const revalidate = 600;

function titleFor(name: string) {
  return `${name} Coupons, Promo Codes & Deals - Updated ${monthYear()}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Same single-argument call as the page body so React cache() serves both from one query.
  const result = await getStore(slug);
  if (!result) {
    return buildMetadata({
      title: "Store not found · MyPerkFinder",
      description: "This store is not available.",
      path: `/stores/${slug}`,
      noindex: true,
    });
  }
  const { store, coupons, deals } = result;
  return buildMetadata({
    title: titleFor(store.name),
    description: `Find ${store.dealsCount} active ${store.name} deals and ${coupons.length} coupon codes. Save on ${deals[0]?.category ?? "top products"} and more — verified and updated ${monthYear()}.`,
    path: `/stores/${store.slug}`,
    keywords: [`${store.name} coupons`, `${store.name} promo code`, `${store.name} deals`],
  });
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  // Explicit locale: `undefined` resolves to the server's locale during prerender and the
  // visitor's in the client, which produced a hydration mismatch on this date.
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function StoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getStore(slug);
  if (!result) notFound();

  const { store, deals, coupons, lastVerifiedAt, topCategories, similarStores } = result;
  const logoUrl = resolveStoreLogoUrl(store.slug, store.logoUrl);
  const verifiedDate = formatDate(lastVerifiedAt);

  const couponCards = coupons.map((d) => {
    const e = expiryLabel(d.expiryDate);
    return {
      id: d.id,
      merchantName: d.merchantName,
      title: d.title,
      code: d.couponCode,
      expiryLabel: e.label ?? "No expiry",
      isUrgent: e.urgent,
    };
  });

  return (
    <>
      <SiteHeader />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Stores", path: "/stores" },
          { name: store.name, path: `/stores/${store.slug}` },
        ])}
      />
      <main id="main" className="mx-auto max-w-6xl px-5 py-6">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Stores", href: "/stores" },
            { label: store.name },
          ]}
          title={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-3">
                {/* next/image with explicit dimensions: this was a raw <img> with no
                    width/height, so the logo contributed layout shift at the top of the
                    page — the worst possible place for CLS. */}
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-pill border border-slate-100 bg-white">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt=""
                      width={40}
                      height={40}
                      sizes="40px"
                      // Brand icons are SVG, which the optimizer rejects. See
                      // logoNeedsUnoptimized. This slot showed the breakage worst: it is
                      // `priority`, so the failing request was also preloaded in <head>.
                      unoptimized={logoNeedsUnoptimized(logoUrl)}
                      className="h-10 w-10 object-contain"
                      priority
                    />
                  ) : (
                    <span aria-hidden className="text-sm font-bold text-ink-600">
                      {store.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span>{store.name} Coupons, Promo Codes &amp; Deals</span>
              </span>
              {store.verified ? (
                <Badge tone="verified" className="self-center">
                  <Icon name="check" size={11} strokeWidth={2.6} />
                  Verified
                </Badge>
              ) : null}
            </span>
          }
          description={
            <>
              {store.dealsCount} active deals · {coupons.length} coupon codes
              {verifiedDate ? ` · Last verified ${verifiedDate}` : ""}
            </>
          }
          actions={
            <>
              <ButtonLink href={`/deals?store=${store.slug}`} variant="outline" size="sm">
                Filter &amp; sort
              </ButtonLink>
              {store.homepageUrl ? (
                <a
                  href={store.homepageUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={cn(
                    "inline-flex min-h-[44px] items-center gap-1 rounded-control px-1 text-mini font-semibold text-brand-700 hover:text-brand-800 hover:underline",
                    focusRing
                  )}
                >
                  Visit {store.name}
                  <Icon name="external" size={14} />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </>
          }
        />

        {couponCards.length > 0 ? (
          <section aria-labelledby="store-coupons" className="mb-10">
            <SectionHeader id="store-coupons" title={`${store.name} coupon codes`} />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {couponCards.map((c) => (
                <li key={c.id}>
                  <CouponCard coupon={c} shopHref={offerRedirectUrl(c.id)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="store-deals" className="mb-10">
          <SectionHeader
            id="store-deals"
            title={`${store.name} deals`}
            actions={
              <ButtonLink href={`/deals?store=${store.slug}`} variant="ghost" size="sm">
                All {store.name} deals
                <Icon name="arrow-right" size={14} />
              </ButtonLink>
            }
          />
          {deals.length === 0 ? (
            <EmptyState
              headingLevel={3}
              title={`No active deals for ${store.name}`}
              description="Check back soon, or browse deals from other stores."
              action={
                <ButtonLink href="/deals" variant="primary">
                  Browse all deals
                </ButtonLink>
              }
            />
          ) : (
            <DealGrid>
              {deals.map((d, i) => (
                <DealCard
                  key={d.id}
                  deal={toCard(d)}
                  href={`/deal/${d.slug}`}
                  saveable
                  /*
                   * `priority` emits a <link rel=preload> and opts the image out of lazy
                   * loading, so it is only a win for images that are actually in the first
                   * viewport. Four was too many here even in the best case, and when this
                   * store has coupon codes the whole grid starts below the fold — those
                   * preloads then compete for bandwidth with the real LCP element above.
                   */
                  priority={couponCards.length === 0 && i < 2}
                />
              ))}
            </DealGrid>
          )}
        </section>

        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <Panel>
            {/* h2: sibling of the SectionHeader sections above, not nested inside one. */}
            <PanelHead title={`How to use a ${store.name} coupon code`} headingLevel={2} />
            <PanelBody className="text-card leading-relaxed text-ink-600">
              <ol className="ml-4 list-decimal space-y-1.5">
                <li>Pick a coupon or deal above and reveal the code.</li>
                <li>Click through to {store.name} — your cart opens on their site.</li>
                <li>Add eligible items and enter the code in the promo/coupon field at checkout.</li>
                <li>Confirm the discount applied before you pay.</li>
              </ol>
              <p className="mt-3 text-mini text-ink-500">
                Codes are provided by affiliate partners and may have eligibility rules set by{" "}
                {store.name}. Final price and availability are confirmed at checkout.
              </p>
            </PanelBody>
          </Panel>

          {topCategories.length > 0 ? (
            <Panel>
              <PanelHead title={`Best categories to save on at ${store.name}`} headingLevel={2} />
              <PanelBody>
                {/* Category links now carry the store through, so they narrow rather than
                    throwing the visitor out to the whole category. */}
                <ul className="flex flex-wrap gap-2">
                  {topCategories.map((c) => (
                    <li key={c.slug}>
                      <ChipLink href={`/deals?store=${store.slug}&category=${c.slug}`}>
                        {c.name}
                        <span className="font-normal text-ink-500">
                          {c.count}
                          <span className="sr-only"> deals</span>
                        </span>
                      </ChipLink>
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          ) : null}
        </div>

        {similarStores.length > 0 ? (
          <section aria-labelledby="store-similar" className="mb-10">
            <SectionHeader id="store-similar" title="Similar stores" />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5">
              {similarStores.map((s) => (
                <li key={s.slug}>
                  <StoreCard store={s} href={`/stores/${s.slug}`} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AffiliateDisclosure />
      </main>
      <SiteFooter />
    </>
  );
}
