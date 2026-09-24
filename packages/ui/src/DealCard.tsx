import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice, focusRing } from "./cn.js";
import { Badge } from "./Badge.js";
import { Icon } from "./Icon.js";
import { computeSavings, hasDisplayablePrices, priceFallbackLabel } from "./deal-pricing.js";
import { logoNeedsUnoptimized, merchantInitials, resolveStoreLogoUrl } from "./store-logos.js";
import { SaveDealButton } from "./SaveDealButton.js";

export interface DealCardData {
  id?: string;
  title: string;
  slug: string;
  merchantName: string;
  salePrice?: number | null;
  regularPrice?: number | null;
  discountPercent: number;
  couponCode?: string | null;
  currency?: string;
  imageUrl?: string | null;
  /** Optional DB/custom merchant logo; popular stores also resolve by name. */
  merchantLogoUrl?: string | null;
  expiryLabel?: string | null;
  isUrgent?: boolean;
  confidenceScore?: number | null;
  verified?: boolean;
  /** Redirect clicks recorded for this deal — rendered as social proof. */
  clicksCount?: number | null;
}

export interface DealCardProps {
  deal: DealCardData;
  href?: string;
  /** Show the save/favourite toggle. Off inside admin tables. */
  saveable?: boolean;
  /** Set on the first row of the first grid so the LCP image is not lazy. */
  priority?: boolean;
  /**
   * Matches the grid's real column width so the browser downloads an
   * appropriately sized file instead of the merchant's full-resolution asset.
   */
  sizes?: string;
}

/** Card image box: 4:3, which suits product photography better than a fixed 128px band. */
const IMAGE_W = 280;
const IMAGE_H = 210;

const DEFAULT_SIZES = "(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 280px";

/**
 * Deal card.
 *
 * Notable changes from the original: it is a server component again (the only
 * reason it was `"use client"` was a useState-driven image `onError`, which
 * hydrated 24 instances on /deals); images go through next/image; navigation
 * uses next/link instead of raw anchors that forced full document reloads; and
 * the whole card is one link target instead of two anchors to the same href.
 */
export function DealCard({
  deal,
  href = "#",
  saveable = false,
  priority = false,
  sizes = DEFAULT_SIZES,
}: DealCardProps) {
  const currency = deal.currency ?? "USD";
  const showPrices = hasDisplayablePrices(deal);
  const save = computeSavings(deal);
  // Discount is the single most persuasive number on the card, so it shows
  // whenever it exists — it used to be suppressed for coupon-only offers that
  // carry a real percentage but no prices.
  const showDiscount = deal.discountPercent > 0;
  const merchantLogo = resolveStoreLogoUrl(deal.merchantName, deal.merchantLogoUrl);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white shadow-card transition hover:border-slate-300 hover:shadow-card-hover focus-within:border-brand-300 focus-within:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            width={IMAGE_W}
            height={IMAGE_H}
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-[1.03]"
          />
        ) : merchantLogo ? (
          <span className="flex h-full flex-col items-center justify-center gap-2 px-4">
            <Image
              src={merchantLogo}
              alt=""
              width={56}
              height={56}
              sizes="56px"
              // Brand icons are SVG, which the optimizer rejects. See logoNeedsUnoptimized.
              unoptimized={logoNeedsUnoptimized(merchantLogo)}
              className="h-14 w-14 object-contain"
            />
            <span className="line-clamp-2 text-center text-micro font-semibold text-ink-500">
              {deal.merchantName}
            </span>
          </span>
        ) : (
          /* One quiet branded fallback, not one of eight random gradients. */
          <span className="flex h-full flex-col items-center justify-center gap-2 bg-brand-50 px-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-pill bg-white text-sm font-extrabold tracking-wide text-brand-800 ring-1 ring-inset ring-brand-100">
              {merchantInitials(deal.merchantName)}
            </span>
            <span className="line-clamp-2 text-micro font-semibold leading-snug text-brand-800">
              {deal.merchantName}
            </span>
          </span>
        )}

        {showDiscount ? (
          <Badge tone="discount" className="absolute left-2 top-2">
            {deal.discountPercent}% off
          </Badge>
        ) : null}

        {saveable && deal.id ? (
          <SaveDealButton
            dealId={deal.id}
            title={deal.title}
            className="absolute right-2 top-2"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1 text-micro font-semibold text-ink-500">
          <span className="truncate">{deal.merchantName}</span>
          {deal.verified ? (
            <Badge tone="verified" className="shrink-0 px-1.5 py-0">
              <Icon name="check" size={11} strokeWidth={2.6} />
              Verified
            </Badge>
          ) : null}
        </div>

        {/*
          One link per card, stretched over the whole surface. Previously the
          image and the title were two separate anchors to the same href, so
          screen readers announced the card twice and clicking the price or
          merchant name did nothing.
        */}
        <h3 className="text-card font-semibold leading-snug text-ink-800">
          <Link
            href={href}
            className={cn(
              "line-clamp-2 transition before:absolute before:inset-0 before:content-[''] group-hover:text-brand-700",
              focusRing
            )}
          >
            {deal.title}
          </Link>
        </h3>

        {deal.couponCode ? (
          <div>
            <Badge tone="coupon">
              <Icon name="coupon" size={12} />
              {deal.couponCode}
            </Badge>
          </div>
        ) : null}

        {showPrices ? (
          <div className="mt-auto flex flex-wrap items-baseline gap-2">
            {deal.salePrice != null && deal.salePrice > 0 ? (
              <span className="text-lg font-extrabold text-ink-800">
                {formatPrice(deal.salePrice, currency)}
              </span>
            ) : null}
            {deal.regularPrice != null && deal.regularPrice > 0 ? (
              <span className="text-xs text-ink-500 line-through">
                {formatPrice(deal.regularPrice, currency)}
              </span>
            ) : null}
            {save != null && save > 0 ? (
              <Badge tone="save">Save {formatPrice(save, currency)}</Badge>
            ) : null}
          </div>
        ) : (
          <p className="mt-auto text-sm font-semibold text-brand-700">{priceFallbackLabel(deal)}</p>
        )}

        <div className="flex min-h-[22px] items-center justify-between gap-2 text-micro text-ink-500">
          {deal.expiryLabel ? (
            <Badge tone={deal.isUrgent ? "urgent" : "expiry"}>
              <Icon name="clock" size={12} />
              {deal.expiryLabel}
            </Badge>
          ) : (
            <span />
          )}
          {/* clicksCount already shipped in the public DTO and was rendered nowhere. */}
          {deal.clicksCount != null && deal.clicksCount >= 10 ? (
            <span className="shrink-0 whitespace-nowrap">
              {formatCount(deal.clicksCount)} used
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatCount(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function DealGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]", className)}
      {...props}
    />
  );
}
