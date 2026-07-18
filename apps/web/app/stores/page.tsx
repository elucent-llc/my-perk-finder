import Link from "next/link";
import { StoreCard, EmptyState, Button } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getStores } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Stores</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Browse deals by retailer. {stores.length} stores with active offers.
        </p>
        {stores.length === 0 ? (
          <EmptyState
            title="No stores listed yet"
            description="Stores appear here as verified deals go live. Check back soon."
            action={
              <Link href="/deals">
                <Button variant="primary">Browse deals</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
            {stores.map((s) => (
              <StoreCard key={s.slug} store={s} href={`/stores/${s.slug}`} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
