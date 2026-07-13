import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeWalmartItem } from "./sources/walmart.js";

describe("normalizeWalmartItem", () => {
  it("maps product prices and discount", () => {
    const offer = normalizeWalmartItem({
      itemId: 42,
      name: "Wireless Mouse",
      salePrice: 15,
      msrp: 25,
      brandName: "Logitech",
      categoryPath: "Electronics/Computers/Mice",
      largeImage: "https://i5.walmartimages.com/mouse.jpg",
      productTrackingUrl: "https://goto.walmart.com/c/mouse",
      productUrl: "https://www.walmart.com/ip/mouse",
    });
    assert.ok(offer);
    assert.equal(offer!.source, "walmart");
    assert.equal(offer!.merchantName, "Walmart");
    assert.equal(offer!.offerType, "product");
    assert.equal(offer!.salePrice, 15);
    assert.equal(offer!.regularPrice, 25);
    assert.equal(offer!.discountPercent, 40);
    assert.equal(offer!.couponCode, null);
    assert.equal(offer!.expiryDate, null);
    assert.equal(offer!.category, "Mice");
  });

  it("returns null without itemId", () => {
    assert.equal(normalizeWalmartItem({ name: "No id" }), null);
  });
});
