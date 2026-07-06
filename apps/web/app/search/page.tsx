import { DealCard, DealGrid, Chip, EmptyState, Button } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { searchDeals, toCard } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchDeals(q) : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <h1 className="text-xl font-extrabold">Results for “{q || "all deals"}”</h1>
        <p className="mb-4 text-sm text-slate-500">{results.length} deals</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {["Deals", "Stores", "Coupons", "Guides"].map((t, i) => (
            <Chip key={t} active={i === 0}>
              {t}
            </Chip>
          ))}
        </div>
        {!q.trim() ? (
          <EmptyState
            title="Enter a search term"
            description="Use the search bar to find deals by product, brand, or store."
            action={
              <a href="/deals">
                <Button variant="primary">Browse all deals</Button>
              </a>
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No exact matches"
            description="Try a broader search term or browse popular deals."
            action={
              <a href="/deals">
                <Button variant="primary">Browse all deals</Button>
              </a>
            }
          />
        ) : (
          <DealGrid>
            {results.map((d) => (
              <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
            ))}
          </DealGrid>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
