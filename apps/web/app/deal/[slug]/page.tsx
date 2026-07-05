import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, DealCard, DealGrid, Panel, PanelHead, PanelBody, AffiliateDisclosure, formatPrice } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { CouponReveal } from "@/components/CouponReveal";
import { getDeal, getDeals, toCard, expiryLabel, offerRedirectUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = await getDeal(slug);
  if (!deal) notFound();

  const e = expiryLabel(deal.expiryDate);
  const save = deal.regularPrice - deal.salePrice;
  const similar = (await getDeals()).filter((d) => d.slug !== deal.slug).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-3 text-sm text-slate-500">
          Deals / {deal.category} / <span className="font-semibold text-slate-800">{deal.title}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid h-[340px] place-items-center rounded-card bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400">
            Product image (alt: “{deal.title}”)
          </div>

          <div>
            <div className="mb-2 flex gap-2">
              {deal.lastVerifiedAt ? <Badge tone="verified">✓ Verified today</Badge> : null}
              {typeof deal.confidenceScore === "number" ? (
                <Badge tone="save">{Math.round(deal.confidenceScore * 100)}% confidence</Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-extrabold">{deal.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Sold by <b>{deal.merchantName}</b>
              {deal.brand ? <> · Brand: <b>{deal.brand}</b></> : null}
            </p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-900">
                {formatPrice(deal.salePrice, deal.currency)}
              </span>
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(deal.regularPrice, deal.currency)}
              </span>
              <Badge tone="discount" className="px-3 py-1 text-sm">
                -{deal.discountPercent}%
              </Badge>
            </div>
            {save > 0 ? <Badge tone="save" className="mt-2">You save {formatPrice(save, deal.currency)}</Badge> : null}

            {deal.couponCode ? (
              <div className="mt-4 rounded-card border border-brand-100 bg-brand-50 p-4">
                <div className="mb-2 text-sm font-bold">Coupon code (applies at checkout)</div>
                <CouponReveal code={deal.couponCode} />
              </div>
            ) : null}

            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-1.5">
                <dt className="text-slate-500">Expires</dt>
                <dd>{e.label ? <Badge tone={e.urgent ? "urgent" : "expiry"}>⏳ {e.label}</Badge> : "—"}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-slate-500">Last verified</dt>
                <dd className="font-semibold">{deal.lastVerifiedAt ? new Date(deal.lastVerifiedAt).toLocaleString() : "—"}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-slate-500">Currency</dt>
                <dd className="font-semibold">{deal.currency ?? "USD"}</dd>
              </div>
            </dl>

            <a
              href={offerRedirectUrl(deal.id)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
            >
              <Button variant="primary" size="lg" block className="mt-4">
                Go to Deal at {deal.merchantName} ↗
              </Button>
            </a>
            <div className="mt-3 flex gap-2.5">
              <Button variant="outline" className="flex-1">♡ Save</Button>
              <Button variant="outline" className="flex-1">🔔 Set Alert</Button>
              <Button variant="outline" className="flex-1">↗ Share</Button>
            </div>

            <AffiliateDisclosure className="mt-3" />
            <div className="mt-3 text-center">
              <button className="text-sm text-slate-500 hover:text-slate-700">⚑ Report expired / incorrect deal</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelHead title="Deal details" />
            <PanelBody className="text-sm text-slate-500">
              Limited-time price drop on {deal.title} at {deal.merchantName}. Price valid while supplies last.
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHead title="Important terms" />
            <PanelBody className="text-sm text-slate-500">
              <ul className="ml-4 list-disc space-y-1">
                <li>Price valid while supplies last.</li>
                {deal.couponCode ? <li>Coupon <b>{deal.couponCode}</b> applies to eligible items only.</li> : null}
                <li>Final price shown at checkout on retailer site.</li>
              </ul>
            </PanelBody>
          </Panel>
        </div>

        <h2 className="mb-3 mt-8 text-base font-bold">Similar deals</h2>
        <DealGrid>
          {similar.map((d) => (
            <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
          ))}
        </DealGrid>
      </main>
      <SiteFooter />
    </>
  );
}
