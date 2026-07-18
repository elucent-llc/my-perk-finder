"use client";
import * as React from "react";
import { Badge } from "./Badge.js";
import { Button } from "./Button.js";
import { Icon } from "./Icon.js";

export interface CouponCardData {
  merchantName: string;
  title: string;
  code?: string | null;
  expiryLabel?: string | null;
  isUrgent?: boolean;
}

export function CouponCard({ coupon, shopHref }: { coupon: CouponCardData; shopHref: string }) {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <div className="relative overflow-hidden rounded-card border border-slate-200 bg-white shadow-card-sm">
      <div className="flex flex-col gap-2.5 p-4">
        <div className="text-[11px] font-semibold text-slate-500">{coupon.merchantName}</div>
        <div className="font-bold text-slate-800">{coupon.title}</div>
        {coupon.code ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="relative overflow-hidden rounded-lg border-[1.5px] border-dashed border-brand-200 bg-brand-50 p-2.5 text-center font-mono font-bold tracking-widest text-brand-700"
          >
            {revealed ? coupon.code : "•••••••"}
            {!revealed ? (
              <span className="absolute inset-0 grid place-items-center bg-brand-600 font-sans tracking-normal text-white">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="coupon" size={15} />
                  Reveal code
                </span>
              </span>
            ) : null}
          </button>
        ) : (
          <Badge tone="active">
            <Icon name="check" size={12} strokeWidth={2.6} />
            No code needed · auto-applied
          </Badge>
        )}
        <div className="flex items-center justify-between">
          {coupon.expiryLabel ? (
            <Badge tone={coupon.isUrgent ? "urgent" : "expiry"}>
              <Icon name="clock" size={12} />
              {coupon.expiryLabel}
            </Badge>
          ) : (
            <span />
          )}
          <a href={shopHref} target="_blank" rel="nofollow sponsored noopener noreferrer">
            <Button variant="primary" size="sm">
              Shop Now
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
