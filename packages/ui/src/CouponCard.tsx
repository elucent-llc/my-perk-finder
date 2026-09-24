import { Badge } from "./Badge.js";
import { ButtonLink } from "./Button.js";
import { Icon } from "./Icon.js";
import { CouponCode } from "./CouponCode.js";

export interface CouponCardData {
  merchantName: string;
  title: string;
  code?: string | null;
  expiryLabel?: string | null;
  isUrgent?: boolean;
}

/**
 * Coupon tile. Now a server component — only the code reveal needs client JS,
 * so that is the one part isolated into <CouponCode>. /coupons previously
 * hydrated up to 50 full cards.
 *
 * The hover treatment matches DealCard and StoreCard; this card used to be
 * completely inert on hover despite containing two actions.
 */
export function CouponCard({ coupon, shopHref }: { coupon: CouponCardData; shopHref: string }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white shadow-card transition hover:border-slate-300 hover:shadow-card-hover">
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="text-micro font-semibold text-ink-500">{coupon.merchantName}</div>
        <h3 className="font-bold leading-snug text-ink-800">{coupon.title}</h3>

        {coupon.code ? (
          <CouponCode code={coupon.code} shopHref={shopHref} />
        ) : (
          <Badge tone="active" className="self-start">
            <Icon name="check" size={12} strokeWidth={2.6} />
            No code needed, applied at checkout
          </Badge>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {coupon.expiryLabel ? (
            <Badge tone={coupon.isUrgent ? "urgent" : "expiry"}>
              <Icon name="clock" size={12} />
              {coupon.expiryLabel}
            </Badge>
          ) : (
            <span />
          )}
          {/* ButtonLink, not <a><Button> — that nested a button inside a link. */}
          <ButtonLink
            href={shopHref}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            variant="primary"
            size="sm"
            className="shrink-0"
          >
            Shop now
            <Icon name="external" size={13} />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
