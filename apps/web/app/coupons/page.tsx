import { CouponCard, EmptyState, ButtonLink } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { getDealsPage, expiryLabel, offerRedirectUrl } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Coupons & Promo Codes · MyPerkFinder",
  description:
    "Browse active coupon codes and promo codes from popular stores. Reveal a code, then apply it at checkout on the merchant site.",
  path: "/coupons",
  keywords: ["coupons", "promo codes", "discount codes", "coupon codes"],
});

const PAGE_SIZE = 24;

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  /*
   * Paginated and filtered in SQL. This used to fetch a fixed 50 coupon deals and then
   * drop the ones without a code in JavaScript, so the page showed an arbitrary subset
   * with no way to reach the rest and an item count that depended on how many of the 50
   * survived the filter.
   */
  const result = await getDealsPage(
    `?couponAvailable=true&page=${page}&pageSize=${PAGE_SIZE}&sort=newest`
  );

  // No `.filter(d => d.couponCode)` here any more: `couponAvailable=true` now excludes empty
  // codes in SQL as well as nulls, so filtering again after pagination would only be able to
  // shorten a page below its stated size — the bug the comment above describes.
  const coupons = result.data.map((d) => {
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
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <PageHeader
          title="Coupons & promo codes"
          description="Reveal a code, then apply it at checkout on the merchant site."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Coupons" }]}
          actions={
            <ButtonLink href="/deals?couponAvailable=true" variant="outline" size="sm">
              Filter by store &amp; category
            </ButtonLink>
          }
        />

        {coupons.length === 0 ? (
          <EmptyState
            title="No active coupons right now"
            description="New promo codes appear as we verify fresh offers. Browse deals in the meantime."
            action={
              <ButtonLink href="/deals" variant="primary">
                Browse deals
              </ButtonLink>
            }
          />
        ) : (
          <>
            {/* minmax(240px,…) rather than 280px: a 280px track plus the page's 40px of
                horizontal padding overflowed any viewport under 320px. */}
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {coupons.map((c) => (
                <li key={c.id}>
                  <CouponCard coupon={c} shopHref={offerRedirectUrl(c.id)} />
                </li>
              ))}
            </ul>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => (p > 1 ? `/coupons?page=${p}` : "/coupons")}
            />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
