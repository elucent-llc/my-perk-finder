import Image from "next/image";
import {
  Badge,
  ButtonLink,
  Icon,
  SaveDealButton,
  computeSavings,
  formatPrice,
  hasDisplayablePrices,
} from "@mpf/ui";
import type { DealDTO } from "@/lib/api";

/**
 * The homepage's single merchandised offer.
 *
 * Fixes here:
 *  - `next/image` with a `sizes` hint replaces a raw `<img>` with no dimensions. This is
 *    the largest image on the homepage, so it was both the CLS source and a full-size
 *    merchant asset download.
 *  - The local `formatPrice` copy is gone. It hardcoded `en-US` and no `minimumFractionDigits`
 *    handling of its own, so it disagreed with the shared helper on whole amounts — the same
 *    deal read `$129` here and `$129.00` on its card two rows below.
 *  - `ButtonLink` replaces `<Link><Button>`, which nested a button inside an anchor.
 *  - Savings and the save toggle now appear here too; this is the most prominent offer on
 *    the site and it was the only card without either.
 */
export function FeaturedDeal({ deal, href }: { deal: DealDTO; href: string }) {
  const showPrices = hasDisplayablePrices(deal);
  const save = computeSavings(deal);

  return (
    <section
      aria-labelledby="featured-deal"
      className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card-hover"
    >
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        {/* aspect ratio on mobile so the box has a height for `fill`; on md the grid row
            takes its height from the copy column and the image stretches to match. */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-600 to-brand-900 md:aspect-auto md:min-h-[260px]">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={deal.title}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <p className="text-mini font-bold uppercase tracking-widest text-brand-100">
                  {deal.merchantName}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-white">{deal.title}</p>
              </div>
            </div>
          )}
          {deal.discountPercent > 0 ? (
            <Badge tone="discount" className="absolute left-4 top-4 text-sm">
              -{deal.discountPercent}% off
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-3 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-accent-50 px-3 py-1 text-micro font-bold uppercase tracking-wide text-accent-800">
              <Icon name="fire" size={13} />
              Featured deal
            </span>
            {deal.id ? <SaveDealButton dealId={deal.id} title={deal.title} /> : null}
          </div>

          <p className="text-mini font-semibold text-ink-600">{deal.merchantName}</p>

          <h2
            id="featured-deal"
            className="text-xl font-extrabold leading-snug tracking-tight text-ink-900"
          >
            {deal.title}
          </h2>

          {showPrices ? (
            <div className="flex flex-wrap items-baseline gap-2.5">
              {deal.salePrice != null && deal.salePrice > 0 ? (
                <span className="text-3xl font-extrabold text-ink-900">
                  {formatPrice(deal.salePrice, deal.currency)}
                </span>
              ) : null}
              {deal.regularPrice != null && deal.regularPrice > 0 ? (
                <span className="text-base text-ink-600 line-through">
                  <span className="sr-only">Regular price </span>
                  {formatPrice(deal.regularPrice, deal.currency)}
                </span>
              ) : null}
              {save != null && save > 0 ? (
                <Badge tone="save">Save {formatPrice(save, deal.currency)}</Badge>
              ) : null}
            </div>
          ) : (
            <p className="text-card font-semibold text-brand-800">
              See current price at {deal.merchantName}
            </p>
          )}

          {deal.couponCode ? (
            <Badge tone="coupon" className="w-fit">
              <Icon name="coupon" size={13} />
              Code: {deal.couponCode}
            </Badge>
          ) : null}

          <div className="mt-1">
            <ButtonLink href={href} variant="primary" size="lg">
              View deal
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
