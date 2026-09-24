import type { Metadata } from "next";
import { ButtonLink, DealCard, DealGrid, EmptyState } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { DealsSortSelect } from "@/components/DealsSortSelect";
import { DealFilters, ActiveFilterChips } from "@/components/DealFilters";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { getCategories, getDealsPage, getStores, toCard } from "@/lib/api";
import {
  DEALS_PAGE_SIZE,
  dealFiltersHref,
  dealFiltersToApiQuery,
  hasActiveFilters,
  parseDealFilters,
} from "@/lib/deal-filters";
import { EXPIRING_SOON_DAYS } from "@/lib/expiry";
import { buildMetadata } from "@/lib/seo";

/**
 * Was `force-dynamic`, which opted the route out of every cache layer including the data
 * cache. Reading `searchParams` still makes the render itself dynamic, but the listing
 * query now comes from the tagged data cache in lib/api (see DEALS_TAG), so repeat views
 * of the same filter combination cost no database work. `revalidate` bounds how long any
 * cached data this route touches may be reused.
 */
export const revalidate = 300;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Canonical always points to the clean /deals URL. Filtered/sorted/paged views
 * are noindex,follow so crawl budget concentrates on category & deal pages.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const filters = parseDealFilters(await searchParams);
  const isNarrowed = hasActiveFilters(filters) || filters.page > 1 || Boolean(filters.q);

  return buildMetadata({
    title: "Today's Best Deals & Discounts · MyPerkFinder",
    description:
      "Browse today's verified deals and discounts from popular stores. Compare savings, then shop at the merchant.",
    path: "/deals",
    noindex: isNarrowed,
    keywords: ["deals", "discounts", "online deals", "best deals today"],
  });
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseDealFilters(await searchParams);

  // Facet options come from the database. The category chips used to be six hardcoded
  // slugs, so a category with deals but no chip was unreachable and a chip whose
  // category had been renamed led to an empty grid.
  const [result, categories, stores] = await Promise.all([
    getDealsPage(dealFiltersToApiQuery(filters, DEALS_PAGE_SIZE)),
    getCategories(),
    getStores(40),
  ]);

  const categoryFacets = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: c.dealsCount,
  }));
  const storeFacets = stores.map((s) => ({
    slug: s.slug,
    name: s.name,
    count: s.dealsCount,
  }));

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const activeStore = stores.find((s) => s.slug === filters.store);

  const title = activeCategory
    ? `${activeCategory.name} deals`
    : activeStore
      ? `${activeStore.name} deals`
      : "Today’s deals";

  const showing =
    result.total === 0
      ? "No matching offers"
      : `${result.total.toLocaleString("en-US")} active offer${result.total === 1 ? "" : "s"}${
          filters.expiresSoon ? ` ending within ${EXPIRING_SOON_DAYS} days` : ""
        }`;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <PageHeader
          title={title}
          description={showing}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Deals" }]}
        />

        {/* Sidebar rail from `lg` up, stacked above the grid below it — the standard
            retail listing layout, and it keeps the facets in a sensible reading order
            for screen readers either way. */}
        <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
          <DealFilters filters={filters} categories={categoryFacets} stores={storeFacets} />

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              {/* Not a live region: every facet change is a server navigation, so this text
                  is never mutated in place and there is nothing for AT to announce. */}
              <p className="text-mini text-ink-600">
                {result.total > 0
                  ? `Showing ${(filters.page - 1) * DEALS_PAGE_SIZE + 1}–${
                      (filters.page - 1) * DEALS_PAGE_SIZE + result.data.length
                    } of ${result.total.toLocaleString("en-US")}`
                  : ""}
              </p>
              <DealsSortSelect filters={filters} />
            </div>

            <ActiveFilterChips
              filters={filters}
              categories={categoryFacets}
              stores={storeFacets}
              className="mb-4"
            />

            {result.data.length === 0 ? (
              <EmptyState
                title="No deals match your filters"
                description="Try removing a filter, widening the price range, or browse every active offer."
                action={
                  <ButtonLink href="/deals" variant="primary">
                    Clear all filters
                  </ButtonLink>
                }
              />
            ) : (
              <>
                <DealGrid>
                  {result.data.map((d, i) => (
                    <DealCard
                      key={d.id}
                      deal={toCard(d)}
                      href={`/deal/${d.slug}`}
                      saveable
                      /* Only the first row can be the LCP element; preloading more
                         would compete with it for bandwidth. */
                      priority={filters.page === 1 && i < 4}
                    />
                  ))}
                </DealGrid>

                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  buildHref={(p) => dealFiltersHref("/deals", filters, { page: p })}
                />
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
