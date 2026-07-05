import { DealCard, DealGrid, Chip, EmptyState, Button } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getDeals, toCard } from "@/lib/api";

export const dynamic = "force-dynamic";

const FILTERS = ["All", "Coupon available", "Verified today", "Ends soon", "25%+ off"];

export default async function DealsPage() {
  const deals = await getDeals();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold">Today’s Deals</h1>
            <p className="text-sm text-slate-500">{deals.length} active offers · updated just now</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f, i) => (
              <Chip key={f} active={i === 0}>
                {f}
              </Chip>
            ))}
          </div>
          <select
            aria-label="Sort deals"
            className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-700"
          >
            <option>Newest</option>
            <option>Highest discount</option>
            <option>Ending soon</option>
            <option>Lowest price</option>
            <option>Most popular</option>
          </select>
        </div>

        {deals.length === 0 ? (
          <EmptyState
            title="No deals match your filters"
            description="Try removing a filter or browse today’s best deals instead."
            action={<Button variant="primary">Clear filters</Button>}
          />
        ) : (
          <>
            <DealGrid>
              {deals.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
              ))}
            </DealGrid>
            <div className="mt-6 text-center">
              <Button variant="outline">Load more deals</Button>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
