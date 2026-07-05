import * as React from "react";
import { cn } from "./cn.js";

export type BadgeTone =
  | "neutral"
  | "discount"
  | "save"
  | "expiry"
  | "urgent"
  | "verified"
  | "coupon"
  | "draft"
  | "active"
  | "review"
  | "expired"
  | "rejected"
  | "archived";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  discount: "bg-savings-600 text-white",
  save: "bg-savings-50 text-savings-700 border border-savings-100",
  expiry: "bg-warn-50 text-warn-700 border border-warn-100",
  urgent: "bg-danger-50 text-danger-700 border border-danger-100",
  verified: "bg-blue-50 text-blue-600",
  coupon: "bg-brand-50 text-brand-700 border border-dashed border-brand-200",
  draft: "bg-slate-100 text-slate-600",
  active: "bg-savings-50 text-savings-700",
  review: "bg-warn-50 text-warn-700",
  expired: "bg-danger-50 text-danger-700",
  rejected: "bg-slate-200 text-slate-700",
  archived: "bg-slate-100 text-slate-500",
};

/** Maps an OfferStatus string to a badge tone. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "draft",
  active: "active",
  needs_review: "review",
  expired: "expired",
  rejected: "rejected",
  archived: "archived",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
