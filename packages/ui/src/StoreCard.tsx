import Image from "next/image";
import Link from "next/link";
import { Badge } from "./Badge.js";
import { Icon } from "./Icon.js";
import { cn, focusRing } from "./cn.js";
import {
  logoNeedsUnoptimized,
  merchantAvatarGradient,
  merchantInitials,
  resolveStoreLogoUrl,
} from "./store-logos.js";

export interface StoreCardData {
  name: string;
  slug: string;
  dealsCount: number;
  couponsCount: number;
  verified?: boolean;
  logoUrl?: string | null;
}

/**
 * Store tile. Now a server component using next/image + next/link — it was
 * `"use client"` only to drive an image `onError`, and used a raw anchor that
 * forced a full document reload.
 *
 * Hover treatment is deliberately the same lift as DealCard; the two cards
 * previously behaved differently (one lifted, one only changed border colour)
 * for no reason a user could infer.
 */
export function StoreCard({ store, href = "#" }: { store: StoreCardData; href?: string }) {
  const logoUrl =
    resolveStoreLogoUrl(store.slug, store.logoUrl) ?? resolveStoreLogoUrl(store.name, store.logoUrl);

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-card border border-slate-200 bg-white p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card-hover",
        focusRing
      )}
    >
      <div
        className={cn(
          "mx-auto mb-2.5 grid h-14 w-14 place-items-center overflow-hidden rounded-pill text-sm font-extrabold tracking-wide",
          logoUrl ? "border border-slate-100 bg-white" : merchantAvatarGradient(store.slug)
        )}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            width={36}
            height={36}
            sizes="36px"
            // Brand icons are SVG, which the optimizer rejects. See logoNeedsUnoptimized.
            unoptimized={logoNeedsUnoptimized(logoUrl)}
            className="h-9 w-9 object-contain"
          />
        ) : (
          <span aria-hidden>{merchantInitials(store.name)}</span>
        )}
      </div>

      <div className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-ink-800">
        {store.name}
      </div>

      <div className="mt-0.5 text-micro text-ink-500">
        {store.dealsCount} {store.dealsCount === 1 ? "deal" : "deals"}
        {store.couponsCount > 0
          ? `, ${store.couponsCount} ${store.couponsCount === 1 ? "coupon" : "coupons"}`
          : ""}
      </div>

      {store.verified ? (
        <div className="mt-2">
          {/* Icon + text, matching every other verified badge in the app —
              this one used a bare "✓" glyph. */}
          <Badge tone="verified">
            <Icon name="check" size={11} strokeWidth={2.6} />
            Verified
          </Badge>
        </div>
      ) : null}
    </Link>
  );
}
