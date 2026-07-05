import { CouponCard, Chip } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getCouponDeals, expiryLabel } from "@/lib/api";

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
      <main className="mx-auto max-w-6xl px-5 py-6">
        <h1 className="mb-4 text-2xl font-extrabold">Coupons &amp; promo codes</h1>
        <div className="mb-5 flex flex-wrap gap-2">
          {["All", "Electronics", "Fashion", "Home", "Beauty"].map((c, i) => (
            <Chip key={c} active={i === 0}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {coupons.length === 0 ? (
            <p className="text-sm text-slate-500">No active coupons right now. Check back soon.</p>
          ) : (
            coupons.map((c) => <CouponCard key={c.id} coupon={c} />)
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
