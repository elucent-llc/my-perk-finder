import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  ButtonLink,
  CouponCode,
  DealCard,
  DealGrid,
  Panel,
  PanelHead,
  PanelBody,
  AffiliateDisclosure,
  Icon,
  SaveDealButton,
  cn,
  focusRing,
  formatPrice,
  computeSavings,
  hasDisplayablePrices,
} from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeader } from "@/components/PageHeader";
import { DealHeroMedia } from "@/components/DealHeroMedia";
import { DealShareActions } from "@/components/DealShareActions";
import { JsonLd } from "@/components/JsonLd";
import { getDeal, getRelatedDeals, toCard, expiryLabel, offerRedirectUrl } from "@/lib/api";
import { isVerifiedToday } from "@/lib/expiry";
import { getSiteUrl } from "@/lib/site";
import { buildMetadata, breadcrumbLd, productLd } from "@/lib/seo";

/**
 * Deal pages are the deep-link surface and are read far more often than they change, but
 * they cannot be prerendered: the Railway build has no route to postgres.railway.internal.
 * getDeal is wrapped in React cache() so metadata and the body share one query.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Identical call to the page body — React cache() then runs the query once per request.
  const deal = await getDeal(slug);
  if (!deal) {
    return buildMetadata({
      title: "Deal not found · MyPerkFinder",
      description: "This deal is no longer available.",
      path: `/deal/${slug}`,
      noindex: true,
    });
  }
  const priced = deal.salePrice != null && deal.salePrice > 0;
  const description = priced
    ? `${deal.title} at ${deal.merchantName} — now ${formatPrice(deal.salePrice!, deal.currency)}${
        deal.discountPercent > 0 ? ` (${deal.discountPercent}% off)` : ""
      }. Shop this verified deal at the merchant.`
    : `${deal.title} at ${deal.merchantName}.${
        deal.couponCode ? " Promo code available." : ""
      } See current pricing on the merchant site.`;
  return buildMetadata({
    title: `${deal.title} — ${deal.merchantName} Deal · MyPerkFinder`,
    description,
    path: `/deal/${deal.slug}`,
    image: deal.imageUrl ?? undefined,
    keywords: [deal.merchantName, deal.category, deal.brand ?? ""].filter(Boolean),
  });
}

function dealDetailsCopy(deal: {
  title: string;
  merchantName: string;
  couponCode?: string | null;
  offerType?: string | null;
}): string {
  if (deal.couponCode) {
    return `Promo code available for ${deal.title} at ${deal.merchantName}. Apply the code at checkout on the merchant site when eligible.`;
  }
  if (deal.offerType === "promotion") {
    return `Limited-time promotion on ${deal.title} at ${deal.merchantName}. Details and eligibility are confirmed on the merchant site.`;
  }
  return `Current offer on ${deal.title} at ${deal.merchantName}. Price and availability are confirmed at checkout on the merchant site.`;
}

export default async function DealDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = await getDeal(slug);
  if (!deal) notFound();

  const e = expiryLabel(deal.expiryDate);
  const showPrices = hasDisplayablePrices(deal);
  const save = computeSavings(deal);
  const verifiedToday = isVerifiedToday(deal.lastVerifiedAt);

  /*
   * One indexed query on merchantId/categoryId. This used to fetch the newest page of
   * deals site-wide and filter it in JavaScript, so a genuinely related deal that was not
   * among the most recent imports could never appear — the rail was usually padded with
   * unrelated offers instead.
   */
  const moreDeals = await getRelatedDeals(deal.slug, deal.merchantId, deal.categoryId, 4);

  const product = productLd({
    title: deal.title,
    slug: deal.slug,
    merchantName: deal.merchantName,
    brand: deal.brand,
    imageUrl: deal.imageUrl,
    salePrice: deal.salePrice,
    currency: deal.currency,
    expiryDate: deal.expiryDate,
  });

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Deals", path: "/deals" },
    ...(deal.categorySlug ? [{ name: deal.category, path: `/category/${deal.categorySlug}` }] : []),
    { name: deal.title, path: `/deal/${deal.slug}` },
  ]);

  const reportHref = `mailto:services@elucent.co?subject=${encodeURIComponent(
    `Expired/incorrect deal: ${deal.title}`
  )}&body=${encodeURIComponent(`This deal looks expired or incorrect:\n\n${getSiteUrl()}/deal/${deal.slug}\n\nDetails:\n`)}`;

  const verifiedOn = deal.lastVerifiedAt
    ? new Date(deal.lastVerifiedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <>
      <SiteHeader />
      <JsonLd data={product ? [breadcrumb, product] : [breadcrumb]} />
      <main id="main" className="mx-auto max-w-5xl px-5 py-8">
        {/* Home was missing from the visible trail even though it was in the structured
            data, and the long deal title is truncated so it cannot wrap to three lines. */}
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: "Home", href: "/" },
            { label: "Deals", href: "/deals" },
            ...(deal.categorySlug
              ? [{ label: deal.category, href: `/category/${deal.categorySlug}` }]
              : []),
            { label: deal.title },
          ]}
        />

        <div className="grid gap-8 md:grid-cols-2">
          <DealHeroMedia
            title={deal.title}
            merchantName={deal.merchantName}
            imageUrl={deal.imageUrl}
            merchantLogoUrl={deal.merchantLogoUrl}
          />

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {deal.lastVerifiedAt ? (
                <Badge tone="verified">
                  <Icon name="check" size={11} strokeWidth={2.6} />
                  {verifiedToday ? "Verified today" : "Verified"}
                </Badge>
              ) : null}
              {deal.couponCode ? (
                <Badge tone="coupon">
                  <Icon name="coupon" size={11} />
                  Coupon available
                </Badge>
              ) : null}
              {deal.clicksCount > 50 ? (
                <Badge tone="active">
                  <Icon name="fire" size={11} />
                  {deal.clicksCount.toLocaleString("en-US")} people used this
                </Badge>
              ) : null}
              {/* The save control existed on cards but not here, which is where people
                  actually decide to come back to an offer later. */}
              <SaveDealButton dealId={deal.id} title={deal.title} className="ml-auto" />
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {deal.title}
            </h1>

            <p className="mt-2 text-card text-ink-600">
              Sold by{" "}
              {deal.merchantSlug ? (
                <Link
                  href={`/stores/${deal.merchantSlug}`}
                  className={cn("rounded-control font-bold text-brand-700 underline", focusRing)}
                >
                  {deal.merchantName}
                </Link>
              ) : (
                <b className="text-ink-800">{deal.merchantName}</b>
              )}
              {deal.categorySlug ? (
                <>
                  {" · "}
                  <Link
                    href={`/category/${deal.categorySlug}`}
                    className={cn(
                      "rounded-control font-semibold text-brand-700 underline",
                      focusRing
                    )}
                  >
                    {deal.category}
                  </Link>
                </>
              ) : null}
              {deal.brand ? (
                <>
                  {" · Brand: "}
                  <b className="text-ink-800">{deal.brand}</b>
                </>
              ) : null}
            </p>

            {showPrices ? (
              <>
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  {deal.salePrice != null && deal.salePrice > 0 ? (
                    <span className="text-4xl font-extrabold text-ink-900">
                      {formatPrice(deal.salePrice, deal.currency)}
                    </span>
                  ) : null}
                  {deal.regularPrice != null && deal.regularPrice > 0 ? (
                    <span className="text-lg text-ink-600 line-through">
                      <span className="sr-only">Regular price </span>
                      {formatPrice(deal.regularPrice, deal.currency)}
                    </span>
                  ) : null}
                  {deal.discountPercent > 0 ? (
                    <Badge tone="discount" className="px-3 py-1 text-sm">
                      -{deal.discountPercent}%
                    </Badge>
                  ) : null}
                </div>
                {save != null && save > 0 ? (
                  <Badge tone="save" className="mt-2">
                    You save {formatPrice(save, deal.currency)}
                  </Badge>
                ) : null}
              </>
            ) : (
              <p className="mt-5 text-card font-semibold text-brand-800">
                {deal.couponCode
                  ? "Promotion offer — see the merchant site for current pricing."
                  : "See the merchant site for current pricing."}
              </p>
            )}

            {deal.couponCode ? (
              <div className="mt-5 rounded-card border border-brand-100 bg-brand-50 p-4">
                <h2 className="mb-2 text-card font-bold text-ink-800">
                  Coupon code (applies at checkout)
                </h2>
                {/* Reveals, copies, announces the result and opens the merchant — the old
                    control revealed the code and then did nothing. */}
                <CouponCode code={deal.couponCode} shopHref={offerRedirectUrl(deal.id)} />
              </div>
            ) : null}

            <dl className="mt-5 divide-y divide-slate-100 text-card">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-600">Expires</dt>
                <dd>
                  {e.label ? (
                    <Badge tone={e.urgent ? "urgent" : "expiry"}>
                      <Icon name="clock" size={11} />
                      {e.label}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-600">Last verified</dt>
                <dd className="font-semibold text-ink-800">
                  {verifiedOn ?? "—"}
                </dd>
              </div>
            </dl>

            {/* ButtonLink: this was a <Button> wrapped in a bare <a>, so assistive tech
                announced a link containing a button and the anchor had no focus ring. */}
            <ButtonLink
              href={offerRedirectUrl(deal.id)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              variant="primary"
              size="lg"
              block
              className="mt-5"
            >
              Go to deal at {deal.merchantName}
              <Icon name="external" size={16} />
              <span className="sr-only">(opens in a new tab)</span>
            </ButtonLink>

            <DealShareActions title={deal.title} url={`${getSiteUrl()}/deal/${deal.slug}`} />

            <AffiliateDisclosure className="mt-4" />

            <p className="mt-3 text-center text-mini text-ink-600">
              Deal expired or incorrect?{" "}
              <a
                href={reportHref}
                className={cn("rounded-control font-semibold text-brand-700 underline", focusRing)}
              >
                Report this deal
              </a>
            </p>
          </div>
        </div>

        {/* headingLevel=2: these two panels are top-level sections of the page and follow
            the h1 directly, so PanelHead's default h3 skipped a level. */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelHead title="Deal details" headingLevel={2} />
            <PanelBody className="text-card leading-relaxed text-ink-600">
              {dealDetailsCopy(deal)}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHead title="Before you buy" headingLevel={2} />
            <PanelBody className="text-card text-ink-600">
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Final price and availability are set by the merchant at checkout.</li>
                {deal.couponCode ? (
                  <li>
                    Coupon <b>{deal.couponCode}</b> applies only to eligible items.
                  </li>
                ) : null}
                <li>MyPerkFinder may earn a commission if you shop through our links.</li>
              </ul>
            </PanelBody>
          </Panel>
        </div>

        {moreDeals.length > 0 ? (
          /* h2, not the h3 this used to render — it sat directly under the page h1 and
             skipped a level. */
          <section aria-labelledby="deal-more" className="mt-10">
            <SectionHeader id="deal-more" title="More like this" />
            <DealGrid>
              {moreDeals.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} saveable />
              ))}
            </DealGrid>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
