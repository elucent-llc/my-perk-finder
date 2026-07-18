import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  DealCard,
  DealGrid,
  Panel,
  PanelHead,
  PanelBody,
  AffiliateDisclosure,
  formatPrice,
  computeSavings,
  hasDisplayablePrices,
} from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { CouponReveal } from "@/components/CouponReveal";
import { DealHeroMedia } from "@/components/DealHeroMedia";
import { DealShareActions } from "@/components/DealShareActions";
import { getDeal, getDeals, toCard, expiryLabel, offerRedirectUrl } from "@/lib/api";
import { isVerifiedToday } from "@/lib/expiry";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

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

  const all = await getDeals();
  const similar = all
    .filter((d) => d.slug !== deal.slug)
    .filter(
      (d) =>
        d.merchantName === deal.merchantName ||
        (deal.category && d.category === deal.category)
    )
    .slice(0, 4);
  const moreDeals = similar.length > 0 ? similar : all.filter((d) => d.slug !== deal.slug).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/deals" className="hover:text-brand-600">
            Deals
          </Link>
          <span className="mx-1.5">/</span>
          <span>{deal.category}</span>
          <span className="mx-1.5">/</span>
          <span className="font-semibold text-slate-800">{deal.title}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <DealHeroMedia
            title={deal.title}
            merchantName={deal.merchantName}
            imageUrl={deal.imageUrl}
            merchantLogoUrl={deal.merchantLogoUrl}
          />

          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {deal.lastVerifiedAt ? (
                <Badge tone="verified">{verifiedToday ? "✓ Verified today" : "✓ Verified"}</Badge>
              ) : null}
              {deal.couponCode ? <Badge tone="coupon">Coupon available</Badge> : null}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {deal.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sold by <b className="text-slate-700">{deal.merchantName}</b>
              {deal.brand ? (
                <>
                  {" "}
                  · Brand: <b className="text-slate-700">{deal.brand}</b>
                </>
              ) : null}
            </p>

            {showPrices ? (
              <>
                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  {deal.salePrice != null && deal.salePrice > 0 ? (
                    <span className="text-4xl font-extrabold text-slate-900">
                      {formatPrice(deal.salePrice, deal.currency)}
                    </span>
                  ) : null}
                  {deal.regularPrice != null && deal.regularPrice > 0 ? (
                    <span className="text-lg text-slate-400 line-through">
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
              <p className="mt-5 text-sm font-semibold text-brand-700">
                {deal.couponCode
                  ? "Promotion offer — see the merchant site for current pricing."
                  : "See the merchant site for current pricing."}
              </p>
            )}

            {deal.couponCode ? (
              <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
                <div className="mb-2 text-sm font-bold text-slate-800">
                  Coupon code (applies at checkout)
                </div>
                <CouponReveal code={deal.couponCode} />
              </div>
            ) : null}

            <dl className="mt-5 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Expires</dt>
                <dd>
                  {e.label ? <Badge tone={e.urgent ? "urgent" : "expiry"}>⏳ {e.label}</Badge> : "—"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Last verified</dt>
                <dd className="font-semibold text-slate-800">
                  {deal.lastVerifiedAt
                    ? new Date(deal.lastVerifiedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
            </dl>

            <a
              href={offerRedirectUrl(deal.id)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
            >
              <Button variant="primary" size="lg" block className="mt-5">
                Go to deal at {deal.merchantName} ↗
              </Button>
            </a>
            <DealShareActions title={deal.title} url={`${getSiteUrl()}/deal/${deal.slug}`} />

            <AffiliateDisclosure className="mt-4" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelHead title="Deal details" />
            <PanelBody className="text-sm leading-relaxed text-slate-600">
              {dealDetailsCopy(deal)}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHead title="Before you buy" />
            <PanelBody className="text-sm text-slate-600">
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
          <>
            <h2 className="mb-3 mt-10 text-lg font-bold tracking-tight text-slate-900">
              {similar.length > 0 ? "More like this" : "More deals"}
            </h2>
            <DealGrid>
              {moreDeals.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
              ))}
            </DealGrid>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
