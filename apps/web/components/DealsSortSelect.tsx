"use client";

import { useRouter } from "next/navigation";
import { cn, focusRing } from "@mpf/ui";
import {
  SORT_OPTIONS,
  dealFiltersHref,
  dealFiltersToSearchParams,
  type DealFilters,
  type SortValue,
} from "@/lib/deal-filters";

/**
 * Sort control.
 *
 * Previously took a loose `Record<string, string>` of params and rebuilt the URL itself,
 * which meant it silently dropped any filter key the caller forgot to pass through —
 * changing the sort could clear your category. It now round-trips the parsed filter
 * state, so sorting preserves every facet and resets to page 1.
 *
 * Wrapped in a GET form with a `noscript` submit so it still works unhydrated.
 */
export function DealsSortSelect({
  filters,
  basePath = "/deals",
}: {
  filters: DealFilters;
  basePath?: string;
}) {
  const router = useRouter();

  return (
    <form
      action={basePath}
      method="get"
      className="flex items-center gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Carry the active facets through the unhydrated submit path, otherwise sorting
          without JS would drop them. */}
      {[...dealFiltersToSearchParams(filters, { includePage: false })]
        .filter(([key]) => key !== "sort")
        .map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}
      <label htmlFor="deals-sort" className="text-mini font-semibold text-ink-600">
        Sort
      </label>
      <select
        id="deals-sort"
        name="sort"
        value={filters.sort}
        className={cn(
          "min-h-[44px] rounded-control border border-slate-300 bg-white px-2.5 text-mini font-semibold text-ink-700",
          focusRing
        )}
        onChange={(e) => {
          router.push(dealFiltersHref(basePath, filters, { sort: e.target.value as SortValue }));
        }}
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <noscript>
        <button
          type="submit"
          className="min-h-[44px] rounded-control bg-brand-700 px-3 text-mini font-semibold text-white"
        >
          Apply
        </button>
      </noscript>
    </form>
  );
}
