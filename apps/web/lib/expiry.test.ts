import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expiryLabel } from "./expiry.js";

describe("expiryLabel", () => {
  it("returns null when missing", () => {
    assert.deepEqual(expiryLabel(null), { label: null, urgent: false });
  });

  it("marks past dates as Expired", () => {
    const past = new Date(Date.now() - 864e5).toISOString();
    assert.deepEqual(expiryLabel(past), { label: "Expired", urgent: true });
  });

  it("shows Ends today for <= 1 day", () => {
    const soon = new Date(Date.now() + 12 * 3600e3).toISOString();
    assert.deepEqual(expiryLabel(soon), { label: "Ends today", urgent: true });
  });

  it("shows day count for near-term expiries", () => {
    const in5 = new Date(Date.now() + 5 * 864e5).toISOString();
    assert.equal(expiryLabel(in5).label, "5 days");
    assert.equal(expiryLabel(in5).urgent, false);
  });

  it("shows Ongoing for absurd far-future Awin dates", () => {
    const far = new Date(Date.now() + 9000 * 864e5).toISOString();
    assert.deepEqual(expiryLabel(far), { label: "Ongoing", urgent: false });
  });
});
