import Link from "next/link";
import { DealCard, DealGrid, EmptyState, Button } from "@mpf/ui";
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
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {q.trim() ? (
            <>
              Results for “{q.trim()}”
            </>
          ) : (
            "Search deals"
          )}
        </h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          {q.trim() ? `${results.length} deals found` : "Search by product, brand, or store name."}
        </p>

        <form
          action="/search"
          className="mb-8 flex max-w-xl items-center gap-2 rounded-full border border-slate-200 bg-white p-2 pl-4 shadow-sm"
        >
          <input
            name="q"
            defaultValue={q}
            aria-label="Search deals"
            placeholder="Try headphones, Nike, Walmart…"
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-800 outline-none"
          />
          <Button type="submit" variant="primary" className="rounded-full px-5">
            Search
          </Button>
        </form>

        {!q.trim() ? (
          <EmptyState
            title="Enter a search term"
            description="Find deals by product, brand, or store — or browse everything."
            action={
              <Link href="/deals">
                <Button variant="primary">Browse all deals</Button>
              </Link>
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Try a broader term, or browse popular deals instead."
            action={
              <Link href="/deals">
                <Button variant="primary">Browse all deals</Button>
              </Link>
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
