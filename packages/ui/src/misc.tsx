import * as React from "react";
import { cn } from "./cn.js";
import { Icon } from "./Icon.js";

export function Chip({
  active,
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-[13px] font-semibold transition",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600",
        className
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-14 text-center text-slate-500">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-500">
        {icon ?? <Icon name="search" size={26} />}
      </div>
      <h3 className="mb-1.5 text-[17px] font-bold text-ink-800">{title}</h3>
      {description ? <p className="mx-auto mb-4 max-w-sm text-[13.5px]">{description}</p> : null}
      {action}
    </div>
  );
}

export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500",
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
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm", tones[tone])}>
      {children}
    </div>
  );
}
