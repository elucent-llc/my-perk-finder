import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SORT,
  PRICE_BANDS,
  activeFilterChips,
  activeFilterCount,
  clearFiltersHref,
  dealFiltersHref,
  dealFiltersToApiQuery,
  dealFiltersToSearchParams,
  hasActiveFilters,
  parseDealFilters,
  priceBandHref,
  priceBandKey,
  toggleFilterHref,
  type DealFilters,
} from "./deal-filters";

/**
 * Every filter link, chip, sort control and pagination href on /deals, and the API query
 * behind the listing itself, is produced by this module. The behaviour worth pinning down
 * is not the happy path but the four bugs it was written to fix:
 *
 *  1. changing one facet used to drop the others (choosing a category cleared the sort),
 *  2. an unfiltered listing canonicalised to `/deals?sort=newest&page=1`, a duplicate of
 *     `/deals` for crawlers,
 *  3. a narrowing change kept you on whatever page number you were on, which was usually
 *     past the end of the new result set, and
 *  4. the boolean facets were a mutually exclusive group, so "has a code" and "ending
 *     soon" could not be combined.
 */

const base = (patch: Partial<DealFilters> = {}): DealFilters => ({
  sort: DEFAULT_SORT,
  page: 1,
  ...patch,
});

describe("parseDealFilters", () => {
  it("defaults an empty URL to newest, page 1, no facets", () => {
    const f = parseDealFilters({});
    assert.equal(f.sort, "newest");
    assert.equal(f.page, 1);
    assert.equal(hasActiveFilters(f), false);
    assert.equal(activeFilterCount(f), 0);
  });

  it("reads every facet the query layer supports", () => {
    const f = parseDealFilters({
      q: "  air fryer ",
      store: "walmart",
      category: "kitchen",
      brand: "Ninja",
      minPrice: "25",
      maxPrice: "50",
      minDiscount: "40",
      couponAvailable: "true",
      expiresSoon: "true",
      verifiedToday: "true",
      sort: "lowest_price",
      page: "3",
    });
    assert.deepEqual(f, {
      q: "air fryer",
      store: "walmart",
      category: "kitchen",
      brand: "Ninja",
      minPrice: 25,
      maxPrice: 50,
      minDiscount: 40,
      couponAvailable: true,
      expiresSoon: true,
      verifiedToday: true,
      sort: "lowest_price",
      page: 3,
    });
    // store + category + brand + minDiscount + one price range + all three booleans.
    // The old single-key status model could not express more than one boolean at a time.
    assert.equal(activeFilterCount(f), 8);
  });

  it("never throws on junk, and falls back rather than propagating it", () => {
    const f = parseDealFilters({
      sort: "'; DROP TABLE deals; --",
      page: "not-a-number",
      minPrice: "-10",
      maxPrice: "NaN",
      minDiscount: "Infinity",
      couponAvailable: "1",
      q: "   ",
      store: [],
    });
    assert.equal(f.sort, DEFAULT_SORT);
    assert.equal(f.page, 1);
    assert.equal(f.minPrice, undefined);
    assert.equal(f.maxPrice, undefined);
    assert.equal(f.minDiscount, undefined);
    // Only the literal string "true" enables a boolean facet.
    assert.equal(f.couponAvailable, false);
    assert.equal(f.q, undefined, "a whitespace-only q must not become an empty search");
    assert.equal(f.store, undefined);
  });

  it("clamps page to a whole number >= 1", () => {
    assert.equal(parseDealFilters({ page: "0" }).page, 1);
    assert.equal(parseDealFilters({ page: "-4" }).page, 1);
    assert.equal(parseDealFilters({ page: "2.7" }).page, 2);
  });

  it("takes the first value when a param is repeated", () => {
    assert.equal(parseDealFilters({ category: ["shoes", "tools"] }).category, "shoes");
  });
});

describe("canonical URLs", () => {
  it("omits the default sort and page 1 so an unfiltered listing is exactly /deals", () => {
    assert.equal(dealFiltersHref("/deals", base()), "/deals");
    assert.equal(dealFiltersToSearchParams(base()).toString(), "");
  });

  it("writes sort only when it differs from the default", () => {
    assert.equal(dealFiltersToSearchParams(base({ sort: "newest" })).get("sort"), null);
    assert.equal(
      dealFiltersToSearchParams(base({ sort: "ending_soon" })).get("sort"),
      "ending_soon"
    );
  });

  it("round-trips: parse(href) equals the filters that produced it", () => {
    const filters = base({
      category: "kitchen",
      store: "walmart",
      minDiscount: 40,
      minPrice: 25,
      maxPrice: 50,
      couponAvailable: true,
      sort: "highest_discount",
      page: 4,
    });
    const href = dealFiltersHref("/deals", filters, { page: 4 });
    const reparsed = parseDealFilters(
      Object.fromEntries(new URL(href, "https://example.com").searchParams)
    );
    assert.equal(reparsed.category, filters.category);
    assert.equal(reparsed.store, filters.store);
    assert.equal(reparsed.minDiscount, filters.minDiscount);
    assert.equal(reparsed.minPrice, filters.minPrice);
    assert.equal(reparsed.maxPrice, filters.maxPrice);
    assert.equal(reparsed.couponAvailable, true);
    assert.equal(reparsed.expiresSoon, false);
    assert.equal(reparsed.sort, filters.sort);
    assert.equal(reparsed.page, 4);
  });
});

describe("dealFiltersHref", () => {
  it("preserves unrelated facets when one changes (the original bug)", () => {
    const filters = base({ category: "kitchen", store: "walmart", sort: "lowest_price" });
    const href = dealFiltersHref("/deals", filters, { category: "tools" });
    const sp = new URL(href, "https://example.com").searchParams;
    assert.equal(sp.get("category"), "tools");
    assert.equal(sp.get("store"), "walmart", "store must survive a category change");
    assert.equal(sp.get("sort"), "lowest_price", "sort must survive a category change");
  });

  it("resets to page 1 for any change that is not paging", () => {
    const filters = base({ category: "kitchen", page: 7 });
    assert.equal(
      new URL(dealFiltersHref("/deals", filters, { store: "target" }), "https://e.com").searchParams.get(
        "page"
      ),
      null
    );
  });

  it("keeps the page when paging is the change", () => {
    const filters = base({ category: "kitchen", page: 7 });
    assert.equal(
      new URL(dealFiltersHref("/deals", filters, { page: 8 }), "https://e.com").searchParams.get("page"),
      "8"
    );
  });

  it("removes a facet when it is patched to undefined", () => {
    const href = dealFiltersHref("/deals", base({ category: "kitchen" }), { category: undefined });
    assert.equal(href, "/deals");
  });

  it("works against any base path, not just /deals", () => {
    assert.match(dealFiltersHref("/category/kitchen", base({ page: 3 }), { page: 3 }), /^\/category\/kitchen\?/);
  });
});

describe("toggleFilterHref", () => {
  it("turns a facet on, then all the way off rather than to false", () => {
    const on = toggleFilterHref("/deals", base(), "couponAvailable");
    assert.equal(on, "/deals?couponAvailable=true");

    const off = toggleFilterHref("/deals", parseDealFilters({ couponAvailable: "true" }), "couponAvailable");
    assert.equal(off, "/deals", "an off toggle must drop the param, not write couponAvailable=false");
  });

  it("lets the booleans combine", () => {
    let filters = parseDealFilters({});
    for (const key of ["couponAvailable", "expiresSoon", "verifiedToday"] as const) {
      const href = toggleFilterHref("/deals", filters, key);
      filters = parseDealFilters(Object.fromEntries(new URL(href, "https://e.com").searchParams));
    }
    assert.equal(filters.couponAvailable, true);
    assert.equal(filters.expiresSoon, true);
    assert.equal(filters.verifiedToday, true);
  });
});

describe("price bands", () => {
  it("identifies the band matching the current bounds", () => {
    assert.equal(priceBandKey(base({ minPrice: 25, maxPrice: 50 })), "25-50");
    assert.equal(priceBandKey(base({ maxPrice: 25 })), "under-25");
    assert.equal(priceBandKey(base({ minPrice: 250 })), "over-250");
    assert.equal(priceBandKey(base({ minPrice: 31, maxPrice: 99 })), undefined);
  });

  it("every band is reachable and its own href is a toggle", () => {
    for (const band of PRICE_BANDS) {
      const href = priceBandHref("/deals", base(), band.key);
      const applied = parseDealFilters(
        Object.fromEntries(new URL(href, "https://e.com").searchParams)
      );
      assert.equal(priceBandKey(applied), band.key, `${band.key} should apply`);
      assert.equal(
        priceBandHref("/deals", applied, band.key),
        "/deals",
        `${band.key} should clear when clicked again`
      );
    }
  });

  it("switching bands replaces both bounds instead of merging them", () => {
    const applied = parseDealFilters(
      Object.fromEntries(
        new URL(priceBandHref("/deals", base({ minPrice: 25, maxPrice: 50 }), "over-250"), "https://e.com")
          .searchParams
      )
    );
    assert.equal(applied.minPrice, 250);
    assert.equal(applied.maxPrice, undefined);
  });
});

describe("activeFilterChips", () => {
  it("resolves slugs to display names when lookups are supplied", () => {
    const chips = activeFilterChips("/deals", base({ store: "wmt", category: "kit" }), {
      stores: [{ slug: "wmt", name: "Walmart" }],
      categories: [{ slug: "kit", name: "Kitchen" }],
    });
    assert.deepEqual(
      chips.map((c) => c.label),
      ["Kitchen", "Walmart"]
    );
  });

  it("falls back to the slug rather than rendering nothing", () => {
    const [chip] = activeFilterChips("/deals", base({ store: "unknown-slug" }));
    assert.equal(chip.label, "unknown-slug");
  });

  it("each removeHref drops only its own filter", () => {
    const filters = base({
      category: "kitchen",
      store: "walmart",
      brand: "Ninja",
      minDiscount: 40,
      minPrice: 25,
      maxPrice: 50,
      couponAvailable: true,
      expiresSoon: true,
      sort: "ending_soon",
    });
    const chips = activeFilterChips("/deals", filters);
    assert.equal(chips.length, activeFilterCount(filters));

    for (const chip of chips) {
      const after = parseDealFilters(
        Object.fromEntries(new URL(chip.removeHref, "https://e.com").searchParams)
      );
      assert.equal(
        activeFilterCount(after),
        activeFilterCount(filters) - 1,
        `removing ${chip.key} should drop exactly one filter`
      );
      assert.equal(after.sort, "ending_soon", "removing a chip must not reset the sort");
    }
  });

  it("counts a price range as one filter even though it is two params", () => {
    assert.equal(activeFilterCount(base({ minPrice: 25, maxPrice: 50 })), 1);
  });
});

describe("clearFiltersHref", () => {
  it("drops the facets but keeps the search term and sort", () => {
    const href = clearFiltersHref(
      "/deals",
      base({
        q: "air fryer",
        sort: "lowest_price",
        category: "kitchen",
        store: "walmart",
        minDiscount: 40,
        couponAvailable: true,
        page: 5,
      })
    );
    const sp = new URL(href, "https://e.com").searchParams;
    assert.equal(sp.get("q"), "air fryer");
    assert.equal(sp.get("sort"), "lowest_price");
    assert.equal(sp.get("category"), null);
    assert.equal(sp.get("store"), null);
    assert.equal(sp.get("minDiscount"), null);
    assert.equal(sp.get("couponAvailable"), null);
    assert.equal(sp.get("page"), null);
  });

  it("returns the bare path when there was nothing to keep", () => {
    assert.equal(clearFiltersHref("/deals", base({ category: "kitchen" })), "/deals");
  });
});

describe("dealFiltersToApiQuery", () => {
  it("always pins page and pageSize so the query layer never guesses", () => {
    const sp = new URLSearchParams(dealFiltersToApiQuery(base({ page: 1 }), 24).slice(1));
    assert.equal(sp.get("page"), "1");
    assert.equal(sp.get("pageSize"), "24");
  });

  it("passes the facets straight through", () => {
    const sp = new URLSearchParams(
      dealFiltersToApiQuery(
        base({ category: "kitchen", minDiscount: 40, expiresSoon: true, sort: "ending_soon", page: 2 }),
        12
      ).slice(1)
    );
    assert.equal(sp.get("category"), "kitchen");
    assert.equal(sp.get("minDiscount"), "40");
    assert.equal(sp.get("expiresSoon"), "true");
    assert.equal(sp.get("sort"), "ending_soon");
    assert.equal(sp.get("page"), "2");
    assert.equal(sp.get("pageSize"), "12");
  });
});
