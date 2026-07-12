import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serializeDeal, serializePublicDeal } from "./serialize.js";

const baseDeal = {
  id: "d1",
  title: "Test",
  slug: "test",
  brand: null,
  offerType: "promotion",
  regularPrice: null,
  salePrice: null,
  discountPercent: 0,
  couponCode: null,
  currency: "USD",
  imageUrl: null,
  affiliateUrl: "https://track.example/aff",
  productUrl: null,
  expiryDate: null,
  lastVerifiedAt: null,
  sourceName: "awin",
  externalId: "x1",
  source: "awin",
  status: "active",
  confidenceScore: 0.8,
  validationFlags: [],
  clicksCount: 0,
  savesCount: 0,
  merchantId: null,
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  description: null,
  startDate: null,
} as const;

describe("serializePublicDeal", () => {
  it("omits affiliateUrl", () => {
    const full = serializeDeal(baseDeal as never);
    assert.equal(full.affiliateUrl, "https://track.example/aff");
    const pub = serializePublicDeal(baseDeal as never);
    assert.equal("affiliateUrl" in pub, false);
  });
});
