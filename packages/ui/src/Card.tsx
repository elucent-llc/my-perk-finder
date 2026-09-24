import * as React from "react";
import { cn } from "./cn.js";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-slate-200 bg-white shadow-card",
        className
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-slate-200 bg-white shadow-card",
        className
      )}
      {...props}
    />
  );
}

/**
 * `headingLevel` matches the EmptyState convention: the rendered level has to follow from
 * where the panel sits, not from the component.
 *
 * This was a hardcoded `h3`, which is right on the admin tables (they sit under an h2
 * section) but skips h2 entirely on the deal detail page, where the "Deal details" and
 * "Terms" panels follow the h1 directly. Heading level is how screen-reader users navigate a
 * page — SC 1.3.1 — and a skipped level reads as a missing section.
 */
export function PanelHead({
  title,
  action,
  className,
  headingLevel = 3,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div className={cn("flex items-center gap-3 border-b border-slate-200 px-4 py-3.5", className)}>
      <Heading className="text-ui font-bold text-ink-800">{title}</Heading>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
