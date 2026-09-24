import Link from "next/link";
import { cn, focusRing } from "@mpf/ui";

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the current page is not a link. */
  href?: string;
}

/**
 * Breadcrumb trail.
 *
 * The deal, store and category pages each rendered an ad-hoc row of `<Link>`s separated
 * by a "/" text node: not a list, not a navigation landmark, no `aria-current`, and the
 * separator was read aloud as content. Retail sites also get real SEO value out of the
 * matching BreadcrumbList structured data, which is emitted alongside this.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-mini text-ink-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-x-1.5">
              {i > 0 ? (
                <span aria-hidden className="text-slate-300">
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn("rounded-control hover:text-brand-700 hover:underline", focusRing)}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-ink-700">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * schema.org BreadcrumbList for the same trail. Absolute URLs are required by the spec,
 * so callers pass the site origin.
 */
export function breadcrumbJsonLd(items: Crumb[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };
}
