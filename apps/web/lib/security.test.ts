import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeAdminNextPath } from "./safe-redirect.js";
import { hashIp } from "./server/click-tracking.js";

describe("click hashIp", () => {
  it("is stable and truncated", () => {
    const a = hashIp("1.2.3.4", "secret-one");
    const b = hashIp("1.2.3.4", "secret-one");
    const c = hashIp("1.2.3.4", "secret-two");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 32);
  });
});

describe("safeAdminNextPath (regression)", () => {
  it("blocks open redirects", () => {
    assert.equal(safeAdminNextPath("//evil.com"), "/admin");
  });
});
