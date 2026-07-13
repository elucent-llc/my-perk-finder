import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeAwinPromotion } from "./sources/awin.js";

describe("normalizeAwinPromotion", () => {
  it("parses was/now prices from description", () => {
    const offer = normalizeAwinPromotion({
      promotionId: "p1",
      title: "Instant Pot Duo",
      description: "Limited time was $119 now $59",
      advertiser: { id: 1, name: "Amazon" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=1",
      endDate: new Date(Date.now() + 864e5).toISOString(),
    });
    assert.ok(offer);
    assert.equal(offer!.regularPrice, 119);
    assert.equal(offer!.salePrice, 59);
    assert.equal(offer!.discountPercent, 50);
  });

  it("does not invent prices from coupon-like numbers", () => {
    const offer = normalizeAwinPromotion({
      promotionId: "p2",
      title: "15% OFF BEST SELLER",
      description: "Use code AFF15 for 15% off",
      advertiser: { id: 2, name: "TideWe" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=2",
      voucher: { code: "AFF15" },
    });
    assert.ok(offer);
    assert.equal(offer!.salePrice, null);
    assert.equal(offer!.regularPrice, null);
  });

  it("picks imageUrl when present", () => {
    const offer = normalizeAwinPromotion({
      promotionId: "p3",
      title: "Headphones sale",
      advertiser: { id: 3, name: "Best Buy", logoUrl: "https://example.com/logo.png" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=3",
      imageUrl: "https://example.com/product.jpg",
    });
    assert.ok(offer);
    assert.equal(offer!.imageUrl, "https://example.com/product.jpg");
  });

  it("nulls absurd far-future end dates as ongoing", () => {
    const offer = normalizeAwinPromotion({
      promotionId: "p4",
      title: "Evergreen promo",
      advertiser: { id: 4, name: "TideWe" },
      urlTracking: "https://www.awin1.com/cread.php?awinmid=4",
      endDate: new Date(Date.now() + 9000 * 864e5).toISOString(),
    });
    assert.ok(offer);
    assert.equal(offer!.expiryDate, null);
  });
});
