import { StoreCard, EmptyState, ButtonLink } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageHeader } from "@/components/PageHeader";
import { getStores } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

/** Merchant list changes only when a feed adds a store; hourly regeneration is plenty. */
export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Stores — Coupons & Deals by Retailer · MyPerkFinder",
  description:
    "Browse deals and coupon codes by store. Find verified offers from the retailers you shop most.",
  path: "/stores",
  keywords: ["stores", "retailers", "store coupons", "store deals"],
});

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <PageHeader
          title="Stores"
          description={`Browse deals by retailer. ${stores.length} ${
            stores.length === 1 ? "store" : "stores"
          } with active offers.`}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Stores" }]}
        />

        {stores.length === 0 ? (
          <EmptyState
            title="No stores listed yet"
            description="Stores appear here as verified deals go live. Check back soon."
            action={
              <ButtonLink href="/deals" variant="primary">
                Browse deals
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5">
            {stores.map((s) => (
              <li key={s.slug}>
                <StoreCard store={s} href={`/stores/${s.slug}`} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
