import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferCategoryFromText, DEFAULT_CATEGORY_KEYWORDS } from "./category-infer.js";

describe("inferCategoryFromText", () => {
  it("maps electronics keywords", () => {
    assert.equal(
      inferCategoryFromText({ title: "Dell XPS 13 Laptop deal" }, DEFAULT_CATEGORY_KEYWORDS),
      "Electronics"
    );
  });

  it("maps audio keywords", () => {
    assert.equal(
      inferCategoryFromText({ title: "Sony WH-1000XM5 Headphones" }, DEFAULT_CATEGORY_KEYWORDS),
      "Audio"
    );
  });

  it("maps fashion from merchant + title", () => {
    assert.equal(
      inferCategoryFromText(
        { title: "Summer sale", merchantName: "Nike", description: "running shoes" },
        DEFAULT_CATEGORY_KEYWORDS
      ),
      "Fashion"
    );
  });

  it("returns null when nothing matches", () => {
    assert.equal(
      inferCategoryFromText({ title: "Mystery promo XYZ" }, DEFAULT_CATEGORY_KEYWORDS),
      null
    );
  });
});
