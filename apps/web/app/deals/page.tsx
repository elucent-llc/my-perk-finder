import Link from "next/link";
import { DealCard, DealGrid, EmptyState, Button } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { DealsSortSelect } from "@/components/DealsSortSelect";
import { getDealsPage, toCard } from "@/lib/api";

export const dynamic = "force-dynamic";

const FILTERS = [
  { label: "All", params: {} as Record<string, string> },
  { label: "Coupon available", params: { couponAvailable: "true" } },
  { label: "Verified today", params: { verifiedToday: "true" } },
  { label: "Ends soon", params: { expiresSoon: "true" } },
  { label: "25%+ off", params: { minDiscount: "25" } },
];

function chipClass(active: boolean) {
  return [
    "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-[13px] font-semibold transition",
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600",
  ].join(" ");
}

function dealsHref(opts: {
  filter?: Record<string, string>;
  sort?: string;
  page?: number;
}): string {
  const p = new URLSearchParams(opts.filter ?? {});
  if (opts.sort && opts.sort !== "newest") p.set("sort", opts.sort);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const qs = p.toString();
  return qs ? `/deals?${qs}` : "/deals";
}

function activeFilterKey(sp: Record<string, string | string[] | undefined>): string {
  if (sp.couponAvailable === "true") return "Coupon available";
  if (sp.verifiedToday === "true") return "Verified today";
  if (sp.expiresSoon === "true") return "Ends soon";
  if (sp.minDiscount === "25") return "25%+ off";
  return "All";
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const activeLabel = activeFilterKey(sp);
  const currentFilter = FILTERS.find((f) => f.label === activeLabel)?.params ?? {};

  const params = new URLSearchParams(currentFilter);
  params.set("page", String(page));
  params.set("pageSize", "24");
  params.set("sort", sort);

  const result = await getDealsPage(`?${params.toString()}`);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold">Today’s Deals</h1>
            <p className="text-sm text-slate-500">
              {result.total} active offers · page {result.page} of {result.totalPages}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.label}
                href={dealsHref({ filter: f.params, sort })}
                className={chipClass(f.label === activeLabel)}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <DealsSortSelect sort={sort} filterParams={currentFilter} />
        </div>

        {result.data.length === 0 ? (
          <EmptyState
            title="No deals match your filters"
            description="Try removing a filter or browse today’s best deals instead."
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
              <div className="mt-6 flex justify-center gap-3">
                {page > 1 ? (
                  <Link href={dealsHref({ filter: currentFilter, sort, page: page - 1 })}>
                    <Button variant="outline">Previous</Button>
                  </Link>
                ) : null}
                {page < result.totalPages ? (
                  <Link href={dealsHref({ filter: currentFilter, sort, page: page + 1 })}>
                    <Button variant="outline">Load more deals</Button>
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
