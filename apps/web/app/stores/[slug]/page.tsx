import Link from "next/link";
import { notFound } from "next/navigation";
import { DealCard, DealGrid, EmptyState, Badge, resolveStoreLogoUrl } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getStore, toCard } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getStore(slug);
  if (!result) notFound();

  const { store, deals } = result;
  const logoUrl = resolveStoreLogoUrl(store.slug, store.logoUrl);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-slate-100 bg-white">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-10 w-10 object-contain" />
            ) : (
              <span className="text-sm font-bold text-slate-500">{store.name.slice(0, 2)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{store.name}</h1>
              {store.verified ? <Badge tone="verified">✓ Verified</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {store.dealsCount} active deals · {store.couponsCount} coupons
            </p>
            {store.homepageUrl ? (
              <a
                href={store.homepageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm font-semibold text-brand-600"
              >
                Visit store site ↗
              </a>
            ) : null}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Active deals</h2>
          <Link href="/deals" className="text-sm font-bold text-brand-600">
            All deals →
          </Link>
        </div>

        {deals.length === 0 ? (
          <EmptyState
            title="No active deals for this store"
            description="Check back after the next import, or browse all deals."
          />
        ) : (
          <DealGrid>
            {deals.map((d) => (
              <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
            ))}
          </DealGrid>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
