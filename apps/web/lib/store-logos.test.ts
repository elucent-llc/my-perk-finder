import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { logoNeedsUnoptimized, merchantInitials, resolveStoreLogoUrl } from "@mpf/ui";

/**
 * Lives here rather than in packages/ui because apps/web is where the test runner is wired
 * up; it exercises the published surface of @mpf/ui either way.
 *
 * What is being pinned: every merchant logo on the site was a broken-image glyph, because
 * resolveStoreLogoUrl hands back cdn.simpleicons.org SVG URLs and next.config.mjs sets
 * `dangerouslyAllowSVG: false`, so /_next/image answered each one with HTTP 400. The fix is
 * for the logo <Image>s to skip the optimizer for exactly those URLs — which only holds if
 * this predicate agrees with what the resolver actually produces.
 */
describe("logoNeedsUnoptimized", () => {
  it("flags every URL the resolver mints for a known store", () => {
    // If a new entry is ever added to POPULAR_STORE_ICONS with a different host, this is the
    // assertion that should fail rather than the logo silently disappearing in production.
    for (const store of [
      "amazon",
      "best-buy",
      "walmart",
      "target",
      "nike",
      "home-depot",
      "under-armour",
      "new-balance",
    ]) {
      const url = resolveStoreLogoUrl(store);
      assert.ok(url, `${store} should resolve to a brand icon`);
      assert.equal(
        logoNeedsUnoptimized(url!),
        true,
        `${url} is SVG and would 400 through /_next/image`
      );
    }
  });

  it("flags a merchant-supplied SVG, with or without a query or fragment", () => {
    assert.equal(logoNeedsUnoptimized("https://cdn.example.com/logo.svg"), true);
    assert.equal(logoNeedsUnoptimized("https://cdn.example.com/logo.SVG"), true);
    assert.equal(logoNeedsUnoptimized("https://cdn.example.com/logo.svg?v=3"), true);
    assert.equal(logoNeedsUnoptimized("https://cdn.example.com/logo.svg#icon"), true);
  });

  it("leaves raster logos to the optimizer", () => {
    // These are the ones worth resizing: feed logos are rasters of unknown size rendered into
    // a 36px avatar, so bypassing the optimizer for them would be a real regression.
    for (const url of [
      "https://cdn.example.com/logo.png",
      "https://cdn.example.com/logo.jpg?w=1200",
      "https://cdn.example.com/svg-team/logo.png",
      "https://cdn.example.com/logo.webp",
      "https://cdn.example.com/logo",
    ]) {
      assert.equal(logoNeedsUnoptimized(url), false, `${url} should still be optimized`);
    }
  });
});

describe("resolveStoreLogoUrl", () => {
  it("prefers the brand icon over a feed-supplied logo for known stores", () => {
    assert.equal(
      resolveStoreLogoUrl("walmart", "https://feed.example.com/wmt.png"),
      "https://cdn.simpleicons.org/walmart"
    );
  });

  it("falls back to the feed logo for everyone else", () => {
    assert.equal(
      resolveStoreLogoUrl("some-small-shop", "https://feed.example.com/shop.png"),
      "https://feed.example.com/shop.png"
    );
  });

  it("treats a blank feed logo as absent so the caller draws initials", () => {
    assert.equal(resolveStoreLogoUrl("some-small-shop", "   "), null);
    assert.equal(resolveStoreLogoUrl("some-small-shop", null), null);
    assert.equal(resolveStoreLogoUrl("some-small-shop"), null);
  });

  it("matches a display name as well as a slug", () => {
    assert.equal(resolveStoreLogoUrl("Best Buy"), "https://cdn.simpleicons.org/bestbuy");
    assert.equal(resolveStoreLogoUrl("Home Depot"), "https://cdn.simpleicons.org/homedepot");
  });
});

describe("merchantInitials", () => {
  it("ignores punctuation and parentheticals", () => {
    // "Oedro (US)" used to produce "O(".
    assert.equal(merchantInitials("Oedro (US)"), "OE");
    assert.equal(merchantInitials("Marks & Spencer"), "MS");
    assert.equal(merchantInitials("Walmart"), "WA");
    assert.equal(merchantInitials("!!!"), "?");
  });
});
