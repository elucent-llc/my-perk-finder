import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ChipLink,
  DealCard,
  DealGrid,
  StoreCard,
  Panel,
  PanelHead,
  PanelBody,
  AffiliateDisclosure,
  EmptyState,
  ButtonLink,
} from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { getCategory, toCard } from "@/lib/api";
import { buildMetadata, breadcrumbLd, monthYear } from "@/lib/seo";

/**
 * Category pages are the SEO surface of the site and change only when the importer runs,
 * so they are regenerated on a ten-minute window instead of rendered per request.
 */
export const revalidate = 600;

const PAGE_SIZE = 24;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

function pageFrom(sp: { page?: string }) {
  const n = Number(sp.page);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function titleFor(name: string) {
  return `Best ${name} Deals Today - Updated ${monthYear()}`;
}

function introFor(name: string, total: number, stores: number, seoDescription?: string | null) {
  if (seoDescription && seoDescription.trim().length > 0) return seoDescription;
  return `Browse the best ${name.toLowerCase()} deals and discounts available right now. We track ${total} active ${name.toLowerCase()} ${total === 1 ? "offer" : "offers"} from ${stores} ${stores === 1 ? "store" : "stores"} and refresh prices regularly, so you can compare savings before you shop at the merchant.`;
}

/**
 * `getCategory` is wrapped in React `cache()`, which keys on the argument list — so this
 * must pass exactly the same `(slug, page, PAGE_SIZE)` as the page body below, or the two
 * run the query twice.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = pageFrom(sp);
  const result = await getCategory(slug, page, PAGE_SIZE);

  if (!result) {
    return buildMetadata({
      title: "Category not found · MyPerkFinder",
      description: "This category is not available.",
      path: `/category/${slug}`,
      noindex: true,
    });
  }

  const { category, total, stores } = result;
  return buildMetadata({
    title: category.seoTitle?.trim() || titleFor(category.name),
    description: introFor(category.name, total, stores.length, category.seoDescription).slice(0, 300),
    path: `/category/${category.slug}`,
    // Page 2+ duplicates the description and competes with page 1 in the index.
    noindex: page > 1,
    keywords: [`${category.name} deals`, `${category.name} discounts`, `cheap ${category.name}`],
  });
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = pageFrom(sp);
  const result = await getCategory(slug, page, PAGE_SIZE);
  if (!result) notFound();

  const { category, total, lastVerifiedAt, deals, stores, related, totalPages } = result;
  const updated = formatDate(lastVerifiedAt);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: category.name },
  ];

  return (
    <>
      <SiteHeader />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />
      <main id="main" className="mx-auto max-w-6xl px-5 py-6">
        {/* Breadcrumbs are a <nav> with an <ol> and aria-current, not a row of links
            separated by a read-aloud "/" text node. */}
        <PageHeader
          breadcrumbs={crumbs}
          eyebrow={`${total} active ${total === 1 ? "offer" : "offers"}${
            updated ? ` · Updated ${updated}` : ` · Updated ${monthYear()}`
          }`}
          title={`Best ${category.name} Deals`}
          description={introFor(category.name, total, stores.length, category.seoDescription)}
          actions={
            /* Every facet on /deals works for a category, so hand users the full filter
               rail rather than leaving this page as a dead end. */
            <ButtonLink href={`/deals?category=${category.slug}`} variant="outline" size="sm">
              Filter &amp; sort these deals
            </ButtonLink>
          }
        />

        <section aria-labelledby="cat-deals" className="mb-10">
          <SectionHeader
            id="cat-deals"
            title={`Top ${category.name} deals`}
            description={
              totalPages > 1 ? `Page ${page} of ${totalPages}` : undefined
            }
          />
          {deals.length === 0 ? (
            <EmptyState
              title="Nothing live in this category right now"
              description="Offers rotate as merchants update their feeds. Try a related category below."
              action={
                <ButtonLink href="/deals" variant="primary">
                  Browse all deals
                </ButtonLink>
              }
            />
          ) : (
            <>
              <DealGrid>
                {deals.map((d, i) => (
                  <DealCard
                    key={d.id}
                    deal={toCard(d)}
                    href={`/deal/${d.slug}`}
                    saveable
                    priority={page === 1 && i < 4}
                  />
                ))}
              </DealGrid>
              {/* The page used to advertise a total it had no way of showing — there was
                  no pagination at all past the first 24. */}
              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={(p) =>
                  p > 1 ? `/category/${category.slug}?page=${p}` : `/category/${category.slug}`
                }
              />
            </>
          )}
        </section>

        {stores.length > 0 ? (
          <section aria-labelledby="cat-stores" className="mb-10">
            <SectionHeader
              id="cat-stores"
              title={`Popular stores for ${category.name.toLowerCase()}`}
            />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3.5">
              {stores.map((s) => (
                <li key={s.slug}>
                  <StoreCard store={s} href={`/stores/${s.slug}`} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <Panel>
            {/* h2: sibling of the SectionHeader sections above, not nested inside one. */}
            <PanelHead title={`Tips for buying ${category.name.toLowerCase()}`} headingLevel={2} />
            <PanelBody className="text-card text-ink-600">
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Compare the sale price against the regular price to gauge real savings.</li>
                <li>Check the expiry date — the best {category.name.toLowerCase()} deals move fast.</li>
                <li>Look for a coupon code that stacks on top of the listed discount.</li>
                <li>Confirm the final price and availability on the merchant site at checkout.</li>
              </ul>
            </PanelBody>
          </Panel>

          {related.length > 0 ? (
            <Panel>
              <PanelHead title="Related categories" headingLevel={2} />
              <PanelBody>
                <ul className="flex flex-wrap gap-2">
                  {related.map((c) => (
                    <li key={c.slug}>
                      <ChipLink href={`/category/${c.slug}`}>
                        {c.name}
                        <span className="font-normal text-ink-500">
                          {c.dealsCount}
                          <span className="sr-only"> deals</span>
                        </span>
                      </ChipLink>
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          ) : null}
        </div>

        <AffiliateDisclosure />
      </main>
      <SiteFooter />
    </>
  );
}
