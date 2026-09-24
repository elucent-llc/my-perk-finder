import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PAGE_WINDOW_SLOTS, pageWindow, type PageSlot } from "./page-window";

/**
 * The invariant worth pinning is not which numbers appear — it is that the row is the same
 * width on every page of a long result set. The previous implementation emitted five slots on
 * page 1 and seven in the middle, so Prev/Next moved under the pointer between clicks.
 */
const numbers = (slots: PageSlot[]) => slots.filter((s): s is number => s !== "gap");

describe("pageWindow", () => {
  it("lists every page when the whole set fits", () => {
    for (let total = 2; total <= PAGE_WINDOW_SLOTS; total += 1) {
      assert.deepEqual(
        pageWindow(1, total),
        Array.from({ length: total }, (_, i) => i + 1),
        `total=${total} should not be truncated`
      );
    }
  });

  it("renders a constant number of slots on every page of a long set", () => {
    for (const total of [8, 9, 12, 40, 200]) {
      for (let current = 1; current <= total; current += 1) {
        assert.equal(
          pageWindow(current, total).length,
          PAGE_WINDOW_SLOTS,
          `page ${current} of ${total} changed the width of the control row`
        );
      }
    }
  });

  it("always offers the current page, the first and the last", () => {
    for (const total of [8, 13, 99]) {
      for (let current = 1; current <= total; current += 1) {
        const nums = numbers(pageWindow(current, total));
        assert.ok(nums.includes(current), `page ${current} of ${total} is not in its own window`);
        assert.ok(nums.includes(1), "first page must always be reachable");
        assert.ok(nums.includes(total), "last page must always be reachable");
      }
    }
  });

  it("stays in range and in ascending order", () => {
    for (const total of [8, 21, 150]) {
      for (let current = 1; current <= total; current += 1) {
        const nums = numbers(pageWindow(current, total));
        assert.deepEqual(nums, [...nums].sort((a, b) => a - b), "page numbers must ascend");
        assert.equal(new Set(nums).size, nums.length, "no page may appear twice");
        for (const n of nums) {
          assert.ok(n >= 1 && n <= total, `${n} is outside 1..${total}`);
        }
      }
    }
  });

  it("never puts a gap where it would hide exactly one page", () => {
    // A "…" standing in for a single number is worse than the number itself.
    for (const total of [8, 9, 10, 30]) {
      for (let current = 1; current <= total; current += 1) {
        const slots = pageWindow(current, total);
        slots.forEach((slot, i) => {
          if (slot !== "gap") return;
          const before = slots[i - 1];
          const after = slots[i + 1];
          if (typeof before === "number" && typeof after === "number") {
            assert.ok(
              after - before > 2,
              `gap between ${before} and ${after} (page ${current} of ${total}) hides one page`
            );
          }
        });
      }
    }
  });

  it("shows the run of first pages at the start and last pages at the end", () => {
    assert.deepEqual(pageWindow(1, 20), [1, 2, 3, 4, 5, "gap", 20]);
    assert.deepEqual(pageWindow(4, 20), [1, 2, 3, 4, 5, "gap", 20]);
    assert.deepEqual(pageWindow(10, 20), [1, "gap", 9, 10, 11, "gap", 20]);
    assert.deepEqual(pageWindow(17, 20), [1, "gap", 16, 17, 18, 19, 20]);
    assert.deepEqual(pageWindow(20, 20), [1, "gap", 16, 17, 18, 19, 20]);
  });
});
