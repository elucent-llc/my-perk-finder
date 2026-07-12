"use client";

import { useRouter } from "next/navigation";

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Highest discount", value: "highest_discount" },
  { label: "Ending soon", value: "ending_soon" },
  { label: "Lowest price", value: "lowest_price" },
  { label: "Most popular", value: "most_popular" },
] as const;

export function DealsSortSelect({
  sort,
  filterParams,
}: {
  sort: string;
  filterParams: Record<string, string>;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Sort deals"
      value={sort}
      className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-700"
      onChange={(e) => {
        const p = new URLSearchParams(filterParams);
        if (e.target.value !== "newest") p.set("sort", e.target.value);
        else p.delete("sort");
        const qs = p.toString();
        router.push(qs ? `/deals?${qs}` : "/deals");
      }}
    >
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
