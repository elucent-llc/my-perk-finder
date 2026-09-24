import * as React from "react";
import { cn } from "@mpf/ui";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/**
 * The single h1 treatment for every route.
 *
 * Before this, /deals used `text-2xl`, /stores `text-3xl`, /coupons `text-xl font-bold`
 * and /categories `text-2xl font-extrabold` — four sizes for the same level of heading,
 * which made the pages feel unrelated and gave no reliable visual cue for "you are
 * here". One component also guarantees each page has exactly one h1.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  eyebrow?: React.ReactNode;
  /** Right-hand controls (sort, "view all"); wraps below the title on small screens. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} className="mb-3" />
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-micro font-bold uppercase tracking-widest text-brand-700">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-ui leading-relaxed text-ink-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/**
 * Section heading inside a page — always an h2, always the same size, so the document
 * outline stays h1 → h2 → h3 (card titles). The homepage previously mixed h2 and styled
 * divs for peer sections.
 */
export function SectionHeader({
  title,
  description,
  actions,
  id,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-subhead font-extrabold tracking-tight text-ink-900 sm:text-xl">
          {title}
        </h2>
        {description ? <p className="mt-1 text-mini text-ink-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
