import * as React from "react";
import { cn, formatPrice } from "./cn.js";
import { Badge } from "./Badge.js";

export interface DealCardData {
  title: string;
  slug: string;
  merchantName: string;
  salePrice: number;
  regularPrice: number;
  discountPercent: number;
  couponCode?: string | null;
  currency?: string;
  imageUrl?: string | null;
  expiryLabel?: string | null;
  isUrgent?: boolean;
  confidenceScore?: number | null;
  verified?: boolean;
}

export interface DealCardProps {
  deal: DealCardData;
  href?: string;
  onSave?: () => void;
}

export function DealCard({ deal, href = "#", onSave }: DealCardProps) {
  const currency = deal.currency ?? "USD";
  const save = deal.regularPrice - deal.salePrice;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white shadow-card-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <a href={href} className="relative block h-32 bg-gradient-to-br from-slate-100 to-slate-200">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
            {deal.title}
          </span>
        )}
        <Badge tone="discount" className="absolute left-2 top-2">
          -{deal.discountPercent}%
        </Badge>
      </a>
      <button
        type="button"
        aria-label="Save deal"
        onClick={onSave}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white/90 text-sm hover:text-brand-600"
      >
        ♡
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          {deal.merchantName}
          {deal.verified ? <Badge tone="verified" className="px-1.5 py-0">✓</Badge> : null}
        </div>
        <a href={href} className="line-clamp-2 min-h-[36px] text-[13.5px] font-semibold leading-snug text-slate-800">
          {deal.title}
        </a>
        {deal.couponCode ? (
          <div>
            <Badge tone="coupon">✂ {deal.couponCode}</Badge>
          </div>
        ) : null}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-slate-900">{formatPrice(deal.salePrice, currency)}</span>
          <span className="text-xs text-slate-400 line-through">{formatPrice(deal.regularPrice, currency)}</span>
          {save > 0 ? <Badge tone="save">Save {formatPrice(save, currency)}</Badge> : null}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          {deal.expiryLabel ? (
            <Badge tone={deal.isUrgent ? "urgent" : "expiry"}>⏳ {deal.expiryLabel}</Badge>
          ) : (
            <span />
          )}
          {typeof deal.confidenceScore === "number" ? (
            <span>{Math.round(deal.confidenceScore * 100)}% conf.</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function DealGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4", className)}
      {...props}
    />
  );
}
