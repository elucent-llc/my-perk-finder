import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedOffer } from "@mpf/affiliate/types";
import { validateOfferForImport } from "./offer.js";

function baseOffer(overrides: Partial<NormalizedOffer> = {}): NormalizedOffer {
  return {
    externalId: "1",
    source: "awin",
    title: "20% off electronics",
    slug: "20-off-electronics",
    merchantName: "Best Buy",
    brand: null,
    category: "Electronics",
    offerType: "promotion",
    regularPrice: null,
    salePrice: null,
    discountPercent: 0,
    couponCode: "SAVE20",
    currency: "USD",
    imageUrl: null,
    affiliateUrl: "https://www.awin1.com/cread.php?awinmid=1",
    productUrl: null,
    startDate: null,
    expiryDate: new Date(Date.now() + 7 * 864e5),
    countryCodes: ["US"],
    description: null,
    confidenceScore: 0.8,
    rawPayload: {},
    ...overrides,
  };
}

describe("validateOfferForImport", () => {
  it("rejects missing affiliate URL", () => {
    const result = validateOfferForImport(baseOffer({ affiliateUrl: null }));
    assert.equal(result.rejected, true);
    assert.equal(result.status, "rejected");
    assert.ok(result.flags.includes("missing_affiliate_url"));
  });

  it("allows active when category is present", () => {
    const result = validateOfferForImport(baseOffer());
    assert.equal(result.rejected, false);
    assert.equal(result.status, "active");
  });

  it("does not force needs_review for missing_category alone", () => {
    const result = validateOfferForImport(baseOffer({ category: null, confidenceScore: 0.8 }));
    assert.equal(result.rejected, false);
    assert.ok(result.flags.includes("missing_category"));
    assert.equal(result.status, "active");
  });

  it("sends low confidence to needs_review", () => {
    const result = validateOfferForImport(baseOffer({ confidenceScore: 0.4 }));
    assert.equal(result.status, "needs_review");
    assert.ok(result.flags.includes("low_confidence_score"));
  });
});
