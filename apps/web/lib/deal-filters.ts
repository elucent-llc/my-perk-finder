/**
 * One place that knows how /deals turns a URL into a query and back again.
 *
 * The page used to read a handful of `searchParams` keys inline, rebuild query strings by
 * string concatenation in three different spots, and drop unrelated params whenever you
 * changed one facet (choosing a category silently cleared the sort). Everything below is
 * pure so it can be used from server components and unit-tested without a request.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Facets that `buildDealWhere` already supported but no UI ever exposed. */
export const DISCOUNT_TIERS = [
  { value: 20, label: "20% or more" },
  { value: 40, label: "40% or more" },
  { value: 60, label: "60% or more" },
  { value: 80, label: "80% or more" },
] as const;

export const PRICE_BANDS = [
  { key: "under-25", label: "Under $25", minPrice: undefined, maxPrice: 25 },
  { key: "25-50", label: "$25 – $50", minPrice: 25, maxPrice: 50 },
  { key: "50-100", label: "$50 – $100", minPrice: 50, maxPrice: 100 },
  { key: "100-250", label: "$100 – $250", minPrice: 100, maxPrice: 250 },
  { key: "over-250", label: "$250 and up", minPrice: 250, maxPrice: undefined },
] as const;

/**
 * Independent booleans, not a mutually exclusive radio group. The previous
 * implementation derived a single `activeStatusKey`, so "has a code" and "expiring soon"
 * could never be combined — the most common pair of intents on a coupon site.
 */
export const TOGGLE_FILTERS = [
  { key: "couponAvailable", label: "Has promo code", icon: "coupon" },
  { key: "expiresSoon", label: "Ending soon", icon: "clock" },
  { key: "verifiedToday", label: "Verified today", icon: "check" },
] as const;

export type ToggleKey = (typeof TOGGLE_FILTERS)[number]["key"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest_discount", label: "Biggest discount" },
  { value: "ending_soon", label: "Ending soonest" },
  { value: "lowest_price", label: "Lowest price" },
  { value: "most_popular", label: "Most popular" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortValue = "newest";
export const DEALS_PAGE_SIZE = 24;

export interface DealFilters {
  q?: string;
  store?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  couponAvailable?: boolean;
  expiresSoon?: boolean;
  verifiedToday?: boolean;
  sort: SortValue;
  page: number;
}

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

function positiveNumber(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function isSort(value: string | undefined): value is SortValue {
  return SORT_OPTIONS.some((s) => s.value === value);
}

/** Tolerant of anything a user or crawler puts in the URL; never throws. */
export function parseDealFilters(params: RawSearchParams = {}): DealFilters {
  const sort = first(params.sort);
  const page = positiveNumber(params.page);

  return {
    q: first(params.q),
    store: first(params.store),
    category: first(params.category),
    brand: first(params.brand),
    minPrice: positiveNumber(params.minPrice),
    maxPrice: positiveNumber(params.maxPrice),
    minDiscount: positiveNumber(params.minDiscount),
    couponAvailable: first(params.couponAvailable) === "true",
    expiresSoon: first(params.expiresSoon) === "true",
    verifiedToday: first(params.verifiedToday) === "true",
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    page: page && page >= 1 ? Math.floor(page) : 1,
  };
}

/**
 * URLSearchParams for the filters, with defaults omitted so the canonical URL of an
 * unfiltered listing stays `/deals` (it was previously `/deals?sort=newest&page=1`,
 * which duplicated the page for crawlers).
 */
export function dealFiltersToSearchParams(
  filters: DealFilters,
  opts?: { pageSize?: number; includePage?: boolean }
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.store) p.set("store", filters.store);
  if (filters.category) p.set("category", filters.category);
  if (filters.brand) p.set("brand", filters.brand);
  if (filters.minPrice != null) p.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) p.set("maxPrice", String(filters.maxPrice));
  if (filters.minDiscount != null) p.set("minDiscount", String(filters.minDiscount));
  if (filters.couponAvailable) p.set("couponAvailable", "true");
  if (filters.expiresSoon) p.set("expiresSoon", "true");
  if (filters.verifiedToday) p.set("verifiedToday", "true");
  if (filters.sort !== DEFAULT_SORT) p.set("sort", filters.sort);
  if (opts?.includePage !== false && filters.page > 1) p.set("page", String(filters.page));
  if (opts?.pageSize) p.set("pageSize", String(opts.pageSize));
  return p;
}

/** Query string for `getDeals()` / `getDealsPage()` — page and pageSize always included. */
export function dealFiltersToApiQuery(filters: DealFilters, pageSize = DEALS_PAGE_SIZE): string {
  const p = dealFiltersToSearchParams(filters, { pageSize });
  p.set("page", String(filters.page));
  return `?${p.toString()}`;
}

/**
 * Href for the same listing with `patch` applied. Any change other than paging resets to
 * page 1 — landing on page 7 of a freshly narrowed result set is a dead end.
 */
export function dealFiltersHref(
  basePath: string,
  filters: DealFilters,
  patch: Partial<DealFilters> = {}
): string {
  const next: DealFilters = {
    ...filters,
    ...patch,
    page: "page" in patch ? (patch.page ?? 1) : 1,
  };
  const qs = dealFiltersToSearchParams(next).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Toggling a boolean facet off means removing it, not setting it to `false`. */
export function toggleFilterHref(
  basePath: string,
  filters: DealFilters,
  key: ToggleKey
): string {
  return dealFiltersHref(basePath, filters, { [key]: !filters[key] } as Partial<DealFilters>);
}

export function priceBandKey(filters: DealFilters): string | undefined {
  return PRICE_BANDS.find(
    (b) => b.minPrice === filters.minPrice && b.maxPrice === filters.maxPrice
  )?.key;
}

export function priceBandHref(
  basePath: string,
  filters: DealFilters,
  key: (typeof PRICE_BANDS)[number]["key"]
): string {
  const band = PRICE_BANDS.find((b) => b.key === key);
  const active = priceBandKey(filters) === key;
  return dealFiltersHref(basePath, filters, {
    minPrice: active ? undefined : band?.minPrice,
    maxPrice: active ? undefined : band?.maxPrice,
  });
}

export function hasActiveFilters(filters: DealFilters): boolean {
  return activeFilterCount(filters) > 0;
}

export function activeFilterCount(filters: DealFilters): number {
  return [
    filters.store,
    filters.category,
    filters.brand,
    filters.minDiscount,
    filters.minPrice ?? filters.maxPrice,
    filters.couponAvailable || undefined,
    filters.expiresSoon || undefined,
    filters.verifiedToday || undefined,
  ].filter((v) => v != null).length;
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  /** Href with just this filter removed; everything else is preserved. */
  removeHref: string;
}

/**
 * Removable chips for what is currently applied. Labels are resolved to display names
 * where possible so a chip reads "Nike" rather than "nike-store-slug".
 */
export function activeFilterChips(
  basePath: string,
  filters: DealFilters,
  lookups?: {
    stores?: Array<{ slug: string; name: string }>;
    categories?: Array<{ slug: string; name: string }>;
  }
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const name = (
    list: Array<{ slug: string; name: string }> | undefined,
    slug: string
  ) => list?.find((x) => x.slug === slug)?.name ?? slug;

  if (filters.category) {
    chips.push({
      key: "category",
      label: name(lookups?.categories, filters.category),
      removeHref: dealFiltersHref(basePath, filters, { category: undefined }),
    });
  }
  if (filters.store) {
    chips.push({
      key: "store",
      label: name(lookups?.stores, filters.store),
      removeHref: dealFiltersHref(basePath, filters, { store: undefined }),
    });
  }
  if (filters.brand) {
    chips.push({
      key: "brand",
      label: filters.brand,
      removeHref: dealFiltersHref(basePath, filters, { brand: undefined }),
    });
  }
  if (filters.minDiscount != null) {
    chips.push({
      key: "minDiscount",
      label: `${filters.minDiscount}%+ off`,
      removeHref: dealFiltersHref(basePath, filters, { minDiscount: undefined }),
    });
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    const band = PRICE_BANDS.find((b) => b.key === priceBandKey(filters));
    chips.push({
      key: "price",
      label:
        band?.label ??
        (filters.minPrice != null && filters.maxPrice != null
          ? `$${filters.minPrice} – $${filters.maxPrice}`
          : filters.maxPrice != null
            ? `Under $${filters.maxPrice}`
            : `$${filters.minPrice} and up`),
      removeHref: dealFiltersHref(basePath, filters, {
        minPrice: undefined,
        maxPrice: undefined,
      }),
    });
  }
  for (const toggle of TOGGLE_FILTERS) {
    if (filters[toggle.key]) {
      chips.push({
        key: toggle.key,
        label: toggle.label,
        removeHref: dealFiltersHref(basePath, filters, {
          [toggle.key]: undefined,
        } as Partial<DealFilters>),
      });
    }
  }
  return chips;
}

/** "Clear all" keeps the free-text query and the chosen sort; only facets are dropped. */
export function clearFiltersHref(basePath: string, filters: DealFilters): string {
  const qs = dealFiltersToSearchParams({
    sort: filters.sort,
    q: filters.q,
    page: 1,
  }).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
