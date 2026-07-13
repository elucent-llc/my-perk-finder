import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeCjLink } from "./sources/cj.js";

describe("normalizeCjLink", () => {
  it("maps coupon links to coupon offerType", () => {
    const offer = normalizeCjLink({
      linkId: "1",
      linkName: "10% Off",
      clickUrl: "https://www.anrdoezrs.net/click-1",
      destinationUrl: "https://merchant.example/sale",
      couponCode: "SAVE10",
      advertiserName: "Merchant Co",
      linkType: "Text Link",
    });
    assert.ok(offer);
    assert.equal(offer!.source, "cj");
    assert.equal(offer!.offerType, "coupon");
    assert.equal(offer!.couponCode, "SAVE10");
    assert.equal(offer!.regularPrice, null);
    assert.equal(offer!.salePrice, null);
  });

  it("rejects missing affiliate URL via low confidence but still returns offer", () => {
    const offer = normalizeCjLink({
      linkId: "2",
      linkName: "Promo",
      advertiserName: "Brand",
    });
    assert.ok(offer);
    assert.equal(offer!.affiliateUrl, null);
    assert.ok(offer!.confidenceScore < 0.7);
  });
});
