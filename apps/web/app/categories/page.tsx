import Link from "next/link";
import { ButtonLink, EmptyState, Icon, cn, focusRing } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageHeader } from "@/components/PageHeader";
import { getCategories } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

/**
 * Cannot be prerendered: the Railway build has no route to postgres.railway.internal.
 * The category list changes only when a feed introduces a new taxonomy entry, so the
 * aggregate `_count` query is cached for an hour in lib/api rather than per render.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Shop Deals by Category · MyPerkFinder",
  description:
    "Browse deals and discounts by category — electronics, home, fashion, beauty and more. Verified offers, updated regularly.",
  path: "/categories",
  keywords: ["deal categories", "shop by category", "category deals"],
});

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        <PageHeader
          title="Shop by category"
          description="Find the best deals in the categories you care about."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Categories" }]}
        />

        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Categories appear here as verified deals go live. Check back soon."
            action={
              <ButtonLink href="/deals" variant="primary">
                Browse all deals
              </ButtonLink>
            }
          />
        ) : (
          /* A list of links is a list: announced with its length, and navigable by list
             shortcuts. minmax(170px,…) instead of 200px so two columns still fit at a
             320px viewport. */
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3.5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className={cn(
                    "group flex min-h-[60px] items-center justify-between gap-2 rounded-card border border-slate-200 bg-white px-4 py-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover",
                    focusRing
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-brand-50 text-brand-700"
                    >
                      <Icon name="tag" size={16} />
                    </span>
                    <span className="min-w-0 font-semibold text-ink-800 group-hover:text-brand-700">
                      {c.name}
                    </span>
                  </span>
                  {/* The bare number read as meaningless; now it says what it counts. */}
                  <span className="shrink-0 text-mini font-bold text-ink-600">
                    {c.dealsCount}
                    <span className="sr-only"> deals</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
