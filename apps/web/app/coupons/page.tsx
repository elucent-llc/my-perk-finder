import Link from "next/link";
import { CouponCard, EmptyState, Button } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getCouponDeals, expiryLabel, offerRedirectUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const deals = await getCouponDeals();
  const coupons = deals.map((d) => {
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
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Coupons &amp; promo codes
        </h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Reveal a code, then apply it at checkout on the merchant site.
        </p>
        {coupons.length === 0 ? (
          <EmptyState
            title="No active coupons right now"
            description="New promo codes appear as we verify fresh offers. Browse deals in the meantime."
            action={
              <Link href="/deals">
                <Button variant="primary">Browse deals</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} shopHref={offerRedirectUrl(c.id)} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
