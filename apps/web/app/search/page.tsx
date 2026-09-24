import { ButtonLink, DealCard, DealGrid, EmptyState } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { SearchBox } from "@/components/SearchBox";
import { getCategories, searchDealsPaged, toCard } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

/** Results are per-query, so the render is dynamic; the query itself is cached upstream. */
export const revalidate = 300;

// Search result pages are useful to users but low-value for the index.
export const metadata = buildMetadata({
  title: "Search Deals · MyPerkFinder",
  description: "Search verified deals and coupons by product, brand, or store name.",
  path: "/search",
  noindex: true,
});

const PAGE_SIZE = 24;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  /*
   * Paginated. The page used to call a getter hard-capped at 24 rows and then print
   * "`results.length` deals found", so a query with 500 matches claimed to have 24 and
   * there was no way to reach the rest.
   */
  const [results, categories] = await Promise.all([
    q ? searchDealsPaged(q, page, PAGE_SIZE) : null,
    // Somewhere to go when a query returns nothing, which is the most common failure
    // mode of a small catalogue and previously ended in a dead end.
    getCategories(6),
  ]);

  const total = results?.total ?? 0;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = (page - 1) * PAGE_SIZE + (results?.data.length ?? 0);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <PageHeader
          title={q ? `Results for “${q}”` : "Search deals"}
          description={
            q
              ? total > 0
                ? `${total.toLocaleString("en-US")} deal${total === 1 ? "" : "s"} found · showing ${from}–${to}`
                : "No deals matched that search."
              : "Search by product, brand, or store name."
          }
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        />

        <div className="mb-8 max-w-xl">
          <SearchBox defaultValue={q} autoFocus={!q} placeholder="Try headphones, Nike, Walmart…" />
        </div>

        {/* There was an sr-only `aria-live` result count here, on the theory that typeahead
            changes the count without a navigation. It does not: the suggestion list has its
            own live region inside SearchBox, and choosing a suggestion or submitting is a
            full server navigation — on a fresh document a live region has no prior state to
            diff, so nothing is ever announced. All it did was repeat, invisibly, the count
            that the PageHeader description above already states, so screen-reader users
            heard it twice while nobody was notified of anything. */}

        {!q ? (
          <EmptyState
            title="Enter a search term"
            description="Find deals by product, brand, or store — or browse everything."
            action={
              <ButtonLink href="/deals" variant="primary">
                Browse all deals
              </ButtonLink>
            }
          />
        ) : total === 0 ? (
          <div>
            <EmptyState
              title={`No matches for “${q}”`}
              description="Check the spelling, try a broader term, or start from a category below."
              action={
                <ButtonLink href="/deals" variant="primary">
                  Browse all deals
                </ButtonLink>
              }
            />
            {categories.length > 0 ? (
              <nav aria-label="Browse categories instead" className="mt-2">
                <h2 className="mb-3 text-center text-mini font-bold uppercase tracking-widest text-ink-500">
                  Popular categories
                </h2>
                <ul className="flex flex-wrap justify-center gap-2">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <ButtonLink href={`/category/${c.slug}`} variant="outline" size="sm">
                        {c.name}
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        ) : (
          <>
            <DealGrid>
              {results!.data.map((d, i) => (
                <DealCard
                  key={d.id}
                  deal={toCard(d)}
                  href={`/deal/${d.slug}`}
                  saveable
                  priority={page === 1 && i < 4}
                />
              ))}
            </DealGrid>

            <Pagination
              page={results!.page}
              totalPages={results!.totalPages}
              buildHref={(p) =>
                p > 1
                  ? `/search?q=${encodeURIComponent(q)}&page=${p}`
                  : `/search?q=${encodeURIComponent(q)}`
              }
            />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
