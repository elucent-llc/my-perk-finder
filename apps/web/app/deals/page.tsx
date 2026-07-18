import Link from "next/link";
import { DealCard, DealGrid, EmptyState, Button } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { DealsSortSelect } from "@/components/DealsSortSelect";
import { getDealsPage, toCard } from "@/lib/api";
import { EXPIRING_SOON_DAYS } from "@/lib/expiry";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "All", slug: "" },
  { label: "Electronics", slug: "electronics" },
  { label: "Audio", slug: "audio" },
  { label: "Home & Kitchen", slug: "home-kitchen" },
  { label: "Fashion", slug: "fashion" },
  { label: "Beauty", slug: "beauty" },
] as const;

const STATUS_FILTERS = [
  { label: "All deals", params: {} as Record<string, string> },
  { label: "Coupon available", params: { couponAvailable: "true" } },
  { label: "Verified today", params: { verifiedToday: "true" } },
  { label: "Ends soon", params: { expiresSoon: "true" } },
  { label: "25%+ off", params: { minDiscount: "25" } },
] as const;

function chipClass(active: boolean) {
  return [
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition",
    active
      ? "border-brand-600 bg-brand-600 text-white shadow-sm"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700",
  ].join(" ");
}

function dealsHref(opts: {
  category?: string;
  filter?: Record<string, string>;
  sort?: string;
  page?: number;
}): string {
  const p = new URLSearchParams(opts.filter ?? {});
  if (opts.category) p.set("category", opts.category);
  if (opts.sort && opts.sort !== "newest") p.set("sort", opts.sort);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const qs = p.toString();
  return qs ? `/deals?${qs}` : "/deals";
}

function activeStatusKey(sp: Record<string, string | string[] | undefined>): string {
  if (sp.couponAvailable === "true") return "Coupon available";
  if (sp.verifiedToday === "true") return "Verified today";
  if (sp.expiresSoon === "true") return "Ends soon";
  if (sp.minDiscount === "25") return "25%+ off";
  return "All deals";
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const category = typeof sp.category === "string" ? sp.category : "";
  const activeStatus = activeStatusKey(sp);
  const statusParams = STATUS_FILTERS.find((f) => f.label === activeStatus)?.params ?? {};

  const params = new URLSearchParams(statusParams);
  if (category) params.set("category", category);
  params.set("page", String(page));
  params.set("pageSize", "24");
  params.set("sort", sort);

  const result = await getDealsPage(`?${params.toString()}`);
  const categoryLabel = CATEGORIES.find((c) => c.slug === category)?.label;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {categoryLabel && category ? `${categoryLabel} deals` : "Today’s deals"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {result.total} active offers
            {activeStatus === "Ends soon" ? ` ending within ${EXPIRING_SOON_DAYS} days` : ""}
            {result.totalPages > 1 ? ` · page ${result.page} of ${result.totalPages}` : ""}
          </p>
        </div>

        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Category</div>
        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={dealsHref({ category: c.slug, filter: statusParams, sort })}
              className={chipClass(c.slug === category)}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f.label}
                href={dealsHref({ category, filter: f.params, sort })}
                className={chipClass(f.label === activeStatus)}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <DealsSortSelect
            sort={sort}
            filterParams={{
              ...statusParams,
              ...(category ? { category } : {}),
            }}
          />
        </div>

        {result.data.length === 0 ? (
          <EmptyState
            title="No deals match your filters"
            description="Try another category, clear a filter, or browse all active offers."
            action={
              <Link href="/deals">
                <Button variant="primary">Clear filters</Button>
              </Link>
            }
          />
        ) : (
          <>
            <DealGrid>
              {result.data.map((d) => (
                <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
              ))}
            </DealGrid>
            {result.totalPages > 1 ? (
              <div className="mt-8 flex justify-center gap-3">
                {page > 1 ? (
                  <Link href={dealsHref({ category, filter: statusParams, sort, page: page - 1 })}>
                    <Button variant="outline">Previous</Button>
                  </Link>
                ) : null}
                {page < result.totalPages ? (
                  <Link href={dealsHref({ category, filter: statusParams, sort, page: page + 1 })}>
                    <Button variant="outline">Next page</Button>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
