/** Slots rendered whenever the list is long enough to need truncating. */
export const PAGE_WINDOW_SLOTS = 7;

export type PageSlot = number | "gap";

/**
 * First page, last page, and a window around the current one — capped so long result sets do
 * not render 200 links (which is both a layout and a tab-order problem).
 *
 * The window is a *fixed* width. The earlier version emitted 5 slots on page 1
 * ([1,2,3,…,20]) and 7 in the middle ([1,…,4,5,6,…,20]), so the control row changed width as
 * you paged and Prev/Next slid sideways under the pointer — on a listing, paging is a repeated
 * click in the same place, and a target that moves after each click means the second click
 * lands on a page number instead. A constant slot count keeps the row geometry stable from the
 * first page to the last.
 *
 * Lives in lib/ rather than beside the component so it can be unit-tested without importing
 * next/link and the whole @mpf/ui barrel.
 */
export function pageWindow(current: number, total: number): PageSlot[] {
  if (total <= PAGE_WINDOW_SLOTS) return Array.from({ length: total }, (_, i) => i + 1);

  // Near the start: show the first five, then a gap and the last page.
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];

  // Near the end: mirror it.
  if (current >= total - 3) {
    return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
  }

  // Middle: the current page with a neighbour either side, gaps to both ends.
  return [1, "gap", current - 1, current, current + 1, "gap", total];
}
