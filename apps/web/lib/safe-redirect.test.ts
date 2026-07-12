import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeAdminNextPath } from "./safe-redirect.js";

describe("safeAdminNextPath", () => {
  it("allows relative admin paths", () => {
    assert.equal(safeAdminNextPath("/admin/review"), "/admin/review");
  });

  it("rejects protocol-relative URLs", () => {
    assert.equal(safeAdminNextPath("//evil.com"), "/admin");
  });

  it("rejects absolute URLs", () => {
    assert.equal(safeAdminNextPath("https://evil.com"), "/admin");
  });

  it("falls back for null", () => {
    assert.equal(safeAdminNextPath(null), "/admin");
  });
});
