import Link from "next/link";
import { Icon, cn, focusRing } from "@mpf/ui";
import { pageWindow } from "@/lib/page-window";

/**
 * Numbered pagination.
 *
 * Every paginated list in the app previously shipped its own Prev/Next pair of bare
 * links: no landmark, no page numbers, no indication of where you were, and no way to
 * jump. Retail listings are browsed by skimming several pages, so the page numbers
 * matter — and screen-reader users need the `<nav>` + `aria-current` to orient at all.
 *
 * `buildHref` keeps this component agnostic about the surrounding query string; each
 * route passes a closure that preserves its own filters.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const pages = pageWindow(current, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("mt-8", className)}>
      <ol className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <PageArrow
            direction="prev"
            href={current > 1 ? buildHref(current - 1) : undefined}
          />
        </li>

        {pages.map((p, i) =>
          p === "gap" ? (
            <li
              key={`gap-${i}`}
              aria-hidden
              className="grid min-h-[44px] w-8 place-items-center text-ink-500"
            >
              &hellip;
            </li>
          ) : (
            <li key={p}>
              <Link
                href={buildHref(p)}
                aria-current={p === current ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  "grid min-h-[44px] min-w-[44px] place-items-center rounded-control border px-3 text-mini font-semibold transition",
                  focusRing,
                  p === current
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-slate-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                )}
              >
                {p}
              </Link>
            </li>
          )
        )}

        <li>
          <PageArrow
            direction="next"
            href={current < totalPages ? buildHref(current + 1) : undefined}
          />
        </li>
      </ol>

      {/* Useful to everyone; the old controls never said which of how many pages you were
          on. Deliberately *not* a live region: paging is a full server navigation, so this
          text never changes in place — a live region only announces mutations to a region
          that was already in the accessibility tree, and on a fresh document there is
          nothing to announce. The page number is carried by `aria-current="page"` on the
          active link and by the document title instead, which is what actually gets read. */}
      <p className="mt-3 text-center text-mini text-ink-500">
        Page {current} of {totalPages}
      </p>
    </nav>
  );
}

function PageArrow({ direction, href }: { direction: "prev" | "next"; href?: string }) {
  const label = direction === "prev" ? "Previous page" : "Next page";
  const text = direction === "prev" ? "Prev" : "Next";
  const icon = direction === "prev" ? "arrow-left" : "arrow-right";
  const base =
    "inline-flex min-h-[44px] items-center gap-1 rounded-control border px-3 text-mini font-semibold transition";

  // A disabled arrow stays in the DOM as inert text so the control row does not
  // reflow between pages, but is not focusable or announced as a link.
  if (!href) {
    return (
      <span
        aria-hidden
        className={cn(base, "cursor-default border-slate-100 bg-slate-50 text-slate-300")}
      >
        {direction === "prev" ? <Icon name={icon} size={14} /> : null}
        {text}
        {direction === "next" ? <Icon name={icon} size={14} /> : null}
      </span>
    );
  }

  return (
    <Link
      href={href}
      rel={direction === "prev" ? "prev" : "next"}
      aria-label={label}
      className={cn(
        base,
        focusRing,
        "border-slate-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
      )}
    >
      {direction === "prev" ? <Icon name={icon} size={14} /> : null}
      {text}
      {direction === "next" ? <Icon name={icon} size={14} /> : null}
    </Link>
  );
}

