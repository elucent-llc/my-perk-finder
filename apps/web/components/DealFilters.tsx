import * as React from "react";
import Link from "next/link";
import { Icon, cn, focusRing } from "@mpf/ui";
import {
  DISCOUNT_TIERS,
  PRICE_BANDS,
  TOGGLE_FILTERS,
  activeFilterChips,
  activeFilterCount,
  clearFiltersHref,
  dealFiltersHref,
  priceBandHref,
  priceBandKey,
  toggleFilterHref,
  type DealFilters as DealFiltersState,
} from "@/lib/deal-filters";

export interface FacetOption {
  slug: string;
  name: string;
  count?: number;
}

/**
 * Faceted filter rail for /deals.
 *
 * `buildDealWhere` has always supported store, brand, price range, discount floor,
 * coupon-available, expiring-soon and verified-today. The UI exposed exactly one of them
 * (category, from six hardcoded slugs) so the rest were unreachable. Narrowing a large
 * listing is the core interaction on a retail site, so this surfaces all of them.
 *
 * Deliberately built from links and `<details>` rather than a client component: the
 * filters work with JS disabled, every state is a shareable URL, and the listing stays a
 * server component that can be cached.
 */
export function DealFilters({
  basePath = "/deals",
  filters,
  categories,
  stores,
}: {
  basePath?: string;
  filters: DealFiltersState;
  categories: FacetOption[];
  stores: FacetOption[];
}) {
  const count = activeFilterCount(filters);

  return (
    <aside aria-labelledby="filters-heading" className="lg:sticky lg:top-20">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="filters-heading"
          className="flex items-center gap-1.5 text-mini font-bold uppercase tracking-widest text-ink-700"
        >
          <Icon name="filter" size={14} />
          Filters
          {count > 0 ? (
            <span className="rounded-pill bg-brand-700 px-1.5 py-0.5 text-micro font-bold text-white">
              {count}
            </span>
          ) : null}
        </h2>
        {count > 0 ? (
          <Link
            href={clearFiltersHref(basePath, filters)}
            className={cn(
              "rounded-control px-1 py-0.5 text-mini font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800",
              focusRing
            )}
          >
            Clear all
          </Link>
        ) : null}
      </div>

      {/* A native <details> rather than a JS drawer: the rail keeps working with scripting
          off and the page stays a cacheable server component. The summary is the collapse
          affordance on phones and is hidden from `lg` up, where the rail is a sidebar.
          Below `lg` the groups tile two-up so an expanded rail stays about one screen
          tall instead of pushing the results far below the fold.

          `open` is unconditional on purpose. Collapsing it by default on an unfiltered
          listing would be the friendlier mobile default, but a closed <details> hides its
          non-summary children at every breakpoint, and the summary that reopens it is
          `lg:hidden` — desktop visitors would get no filter rail and no way to ask for one.
          Making that conditional properly needs the disclosure to exist only below `lg`,
          which means either duplicated markup or the client component this rail was
          deliberately built to avoid. */}
      <details className="group mt-3" open>
        <summary
          className={cn(
            "flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-control border border-slate-200 bg-white px-3 text-mini font-semibold text-ink-700 lg:hidden",
            focusRing
          )}
        >
          {count > 0 ? `${count} filter${count === 1 ? "" : "s"} applied` : "Refine results"}
          <Icon
            name="chevron-down"
            size={16}
            className="transition group-open:rotate-180"
          />
        </summary>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-4 lg:grid-cols-1 lg:gap-4">
          <FacetGroup label="Offer">
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
              {TOGGLE_FILTERS.map((toggle) => (
                <FacetCheck
                  key={toggle.key}
                  href={toggleFilterHref(basePath, filters, toggle.key)}
                  label={toggle.label}
                  checked={Boolean(filters[toggle.key])}
                />
              ))}
            </div>
          </FacetGroup>

          {categories.length > 0 ? (
            <FacetGroup label="Category">
              <FacetList
                options={categories}
                activeSlug={filters.category}
                hrefFor={(slug) =>
                  dealFiltersHref(basePath, filters, {
                    category: filters.category === slug ? undefined : slug,
                  })
                }
              />
            </FacetGroup>
          ) : null}

          <FacetGroup label="Discount">
            <ul className="space-y-0.5">
              {DISCOUNT_TIERS.map((tier) => (
                <li key={tier.value}>
                  <FacetRadio
                    href={dealFiltersHref(basePath, filters, {
                      minDiscount: filters.minDiscount === tier.value ? undefined : tier.value,
                    })}
                    label={tier.label}
                    checked={filters.minDiscount === tier.value}
                  />
                </li>
              ))}
            </ul>
          </FacetGroup>

          <FacetGroup label="Price">
            <ul className="space-y-0.5">
              {PRICE_BANDS.map((band) => (
                <li key={band.key}>
                  <FacetRadio
                    href={priceBandHref(basePath, filters, band.key)}
                    label={band.label}
                    checked={priceBandKey(filters) === band.key}
                  />
                </li>
              ))}
            </ul>
          </FacetGroup>

          {stores.length > 0 ? (
            <FacetGroup label="Store">
              <FacetList
                options={stores}
                activeSlug={filters.store}
                hrefFor={(slug) =>
                  dealFiltersHref(basePath, filters, {
                    store: filters.store === slug ? undefined : slug,
                  })
                }
                max={10}
              />
            </FacetGroup>
          ) : null}
        </div>
      </details>
    </aside>
  );
}

function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-slate-200 bg-white p-3.5">
      <h3 className="mb-2 text-micro font-bold uppercase tracking-widest text-ink-500">{label}</h3>
      {children}
    </section>
  );
}

/**
 * Facet rows look like checkboxes and radios but they are links, and they are announced as
 * links.
 *
 * They previously carried `role="checkbox"` / `role="radio"` with `aria-checked`, which
 * replaces the link role outright. A screen reader then announced "checkbox, not checked"
 * for something that does not respond to Space, is not in a `radiogroup`, and navigates on
 * activation — and AT users who move by links or use a links list lost the entire rail,
 * because none of these were links any more. Roles describe what an element *is*; promising
 * a widget the markup cannot honour is worse than describing a link accurately.
 *
 * State is conveyed two ways instead, both real: `aria-current` (the same mechanism the nav
 * and pagination use for "this is the one you are on") and a visible-to-AT suffix in the
 * accessible name that also explains what activating it will do. The visual tick or dot stays
 * `aria-hidden` — it is a picture of the state, not the state.
 */
function facetStateLabel(checked: boolean) {
  return checked ? <span className="sr-only"> (applied — activate to remove)</span> : null;
}

function FacetCheck({
  href,
  label,
  checked,
}: {
  href: string;
  label: string;
  checked: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={checked ? "true" : undefined}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-2 rounded-control px-2 text-mini font-semibold transition lg:w-full",
        focusRing,
        checked ? "text-brand-800" : "text-ink-700 hover:text-brand-700"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-control border transition",
          checked ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white"
        )}
      >
        {checked ? <Icon name="check" size={12} strokeWidth={3} /> : null}
      </span>
      {label}
      {facetStateLabel(checked)}
    </Link>
  );
}

function FacetRadio({ href, label, checked }: { href: string; label: string; checked: boolean }) {
  return (
    <Link
      href={href}
      aria-current={checked ? "true" : undefined}
      className={cn(
        "flex min-h-[44px] items-center gap-2 rounded-control px-2 text-mini font-semibold transition",
        focusRing,
        checked ? "text-brand-800" : "text-ink-700 hover:text-brand-700"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-pill border transition",
          checked ? "border-brand-700" : "border-slate-300"
        )}
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-pill bg-brand-700" /> : null}
      </span>
      {label}
      {facetStateLabel(checked)}
    </Link>
  );
}

function FacetList({
  options,
  activeSlug,
  hrefFor,
  max,
}: {
  options: FacetOption[];
  activeSlug?: string;
  hrefFor: (slug: string) => string;
  max?: number;
}) {
  // Keep the active option visible even when it falls outside the truncated head of the
  // list, otherwise the applied filter appears to have vanished.
  const shown = max ? options.slice(0, max) : options;
  const active = activeSlug ? options.find((o) => o.slug === activeSlug) : undefined;
  const list = active && !shown.some((o) => o.slug === active.slug) ? [active, ...shown] : shown;

  return (
    <ul className="space-y-0.5">
      {list.map((option) => (
        <li key={option.slug}>
          <FacetCheck
            href={hrefFor(option.slug)}
            label={option.count != null ? `${option.name} (${option.count})` : option.name}
            checked={activeSlug === option.slug}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Applied filters as removable chips above the results. Standard retail affordance and
 * the only way to see the full set of what is narrowing a list when the rail is
 * collapsed on mobile.
 */
export function ActiveFilterChips({
  basePath = "/deals",
  filters,
  categories,
  stores,
  className,
}: {
  basePath?: string;
  filters: DealFiltersState;
  categories?: FacetOption[];
  stores?: FacetOption[];
  className?: string;
}) {
  const chips = activeFilterChips(basePath, filters, { categories, stores });
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-micro font-bold uppercase tracking-widest text-ink-500">Applied</span>
      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.removeHref}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-brand-200 bg-brand-50 pl-3 pr-2 text-mini font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-100",
                focusRing
              )}
            >
              {chip.label}
              <span className="sr-only">— remove filter</span>
              <Icon name="close" size={13} strokeWidth={2.4} aria-hidden />
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={clearFiltersHref(basePath, filters)}
            className={cn(
              "inline-flex min-h-[44px] items-center rounded-pill px-2 text-mini font-semibold text-ink-600 underline decoration-slate-300 underline-offset-2 hover:text-brand-700",
              focusRing
            )}
          >
            Clear all
          </Link>
        </li>
      </ul>
    </div>
  );
}
