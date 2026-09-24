import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseDealQuery } from "./deal-query";

/**
 * Every cached listing is keyed on the string this function is handed, so what it returns is
 * what a visitor sees for the next five minutes. The bug being pinned here: one unparseable
 * param used to discard *all* of them, quietly serving the unfiltered catalogue under a URL
 * that promised something narrower.
 */
describe("parseDealQuery", () => {
  it("defaults an empty query to page 1 of the newest deals", () => {
    const q = parseDealQuery("");
    assert.equal(q.page, 1);
    assert.equal(q.sort, "newest");
    assert.equal(q.category, undefined);
  });

  it("accepts the query string with or without a leading ?", () => {
    assert.deepEqual(parseDealQuery("?category=kitchen"), parseDealQuery("category=kitchen"));
  });

  it("reads the facets the listing supports", () => {
    const q = parseDealQuery(
      "?store=walmart&category=kitchen&brand=Ninja&minPrice=25&maxPrice=50&minDiscount=40&sort=lowest_price&page=3&pageSize=24"
    );
    assert.equal(q.store, "walmart");
    assert.equal(q.category, "kitchen");
    assert.equal(q.brand, "Ninja");
    assert.equal(q.minPrice, 25);
    assert.equal(q.maxPrice, 50);
    assert.equal(q.minDiscount, 40);
    assert.equal(q.sort, "lowest_price");
    assert.equal(q.page, 3);
    assert.equal(q.pageSize, 24);
  });

  it("drops only the invalid param and keeps the valid ones (the original bug)", () => {
    const q = parseDealQuery("?category=kitchen&store=walmart&minPrice=cheap");
    assert.equal(q.category, "kitchen", "a bad price must not clear the category");
    assert.equal(q.store, "walmart", "a bad price must not clear the store");
    assert.equal(q.minPrice, undefined);
  });

  it("keeps the facets when the sort is not one we support", () => {
    const q = parseDealQuery("?category=kitchen&sort=cheapest-ever");
    assert.equal(q.category, "kitchen");
    assert.equal(q.sort, "newest", "an unknown sort falls back to the default");
  });

  it("keeps the facets when the page is out of range", () => {
    const q = parseDealQuery("?store=target&page=0");
    assert.equal(q.store, "target");
    assert.equal(q.page, 1);
  });

  it("keeps the facets when pageSize is past the cap", () => {
    // The cap exists to stop a hand-edited URL asking for the whole table in one query.
    const q = parseDealQuery("?category=tools&pageSize=100000");
    assert.equal(q.category, "tools");
    assert.equal(q.pageSize, 20, "pageSize falls back to the default rather than the cap");
  });

  it("survives several bad params at once without discarding the good ones", () => {
    const q = parseDealQuery(
      "?category=kitchen&minPrice=cheap&maxPrice=dear&page=-1&sort=nonsense&status=imaginary"
    );
    assert.equal(q.category, "kitchen");
    assert.equal(q.page, 1);
    assert.equal(q.sort, "newest");
    assert.equal(q.minPrice, undefined);
    assert.equal(q.maxPrice, undefined);
    assert.equal(q.status, undefined);
  });

  it("never throws, whatever it is handed", () => {
    for (const input of [
      "?",
      "???",
      "&&&",
      "?=",
      "?page",
      "?page=&sort=",
      "?category=%E2%9C%93",
      "?category=%",
      "?sort='; DROP TABLE Deal; --",
      "?page=1e999",
      "?page[]=2",
    ]) {
      assert.doesNotThrow(() => parseDealQuery(input), `threw on ${input}`);
      assert.ok(parseDealQuery(input).page >= 1, `page must stay >= 1 for ${input}`);
    }
  });

  it("passes a repeated param through as URLSearchParams resolves it", () => {
    // Object.fromEntries keeps the last value; the important part is that it is one of them
    // and that nothing is discarded because of the repetition.
    assert.equal(parseDealQuery("?category=a&category=b").category, "b");
  });
});
