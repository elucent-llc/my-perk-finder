import * as React from "react";
import Link from "next/link";
import { cn, focusRing } from "./cn.js";
import { Icon } from "./Icon.js";

/**
 * One chip appearance for the whole app. Previously this component existed but
 * was unused, while /deals, the homepage and category pages each re-implemented
 * it with subtly different hover colours and an extra shadow.
 *
 * 44px min-height meets WCAG 2.5.8; the old chips were ~30px.
 */
export function chipClasses(active?: boolean, className?: string) {
  return cn(
    "inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border px-4 py-2 text-mini font-semibold transition",
    focusRing,
    active
      ? "border-brand-700 bg-brand-700 text-white"
      : "border-slate-200 bg-white text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
    className
  );
}

export function Chip({
  active,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button type={type} className={chipClasses(active, className)} {...props} />;
}

/**
 * Chip that navigates. Filters are links so they work without JS.
 *
 * next/link rather than a bare anchor: every chip in the app pointed at an internal
 * route, so a plain `<a>` threw away the client-side transition and re-downloaded the
 * document on each filter change.
 */
export function ChipLink({
  active,
  className,
  href,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={chipClasses(active, className)}
      {...props}
    />
  );
}

/**
 * `headingLevel` defaults to 2 because an empty state normally follows the
 * page h1 directly — hardcoding h3 here previously skipped a level on
 * /search, /stores, /coupons and /categories.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 2,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = (headingLevel === 3 ? "h3" : "h2") as "h2" | "h3";
  return (
    <div className="px-5 py-14 text-center text-ink-500">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-pill bg-brand-50 text-brand-700">
        {icon ?? <Icon name="search" size={26} />}
      </div>
      <Heading className="mb-1.5 text-subhead font-bold text-ink-800">{title}</Heading>
      {description ? <p className="mx-auto mb-4 max-w-sm text-card">{description}</p> : null}
      {action}
    </div>
  );
}

export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-control border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-ink-500",
        className
      )}
    >
      <Icon name="info" size={16} className="mt-0.5 shrink-0 text-brand-500" />
      <span>
        <b>Affiliate disclosure.</b> MyPerkFinder may earn a commission when you buy through links on
        our site — at no extra cost to you. Prices &amp; availability are accurate as of the last
        verified time.
      </span>
    </div>
  );
}

export function AlertBanner({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    info: "bg-brand-50 border-brand-100 text-brand-700",
    success: "bg-savings-50 border-savings-100 text-savings-700",
    warning: "bg-warn-50 border-warn-100 text-warn-700",
    danger: "bg-danger-50 border-danger-100 text-danger-700",
  } as const;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-control border px-3.5 py-2.5 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
