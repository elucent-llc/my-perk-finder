import Link from "next/link";
import { Badge, Button, Icon } from "@mpf/ui";
import type { DealDTO } from "@/lib/api";

function formatPrice(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function FeaturedDeal({ deal, href }: { deal: DealDTO; href: string }) {
  const hasPrices = deal.salePrice != null && deal.salePrice > 0;
  return (
    <section className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-[220px] bg-gradient-to-br from-brand-600 to-brand-900">
          {deal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-white/90">
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-teal-100/90">
                  {deal.merchantName}
                </div>
                <div className="mt-2 text-2xl font-extrabold">{deal.title}</div>
              </div>
            </div>
          )}
          {deal.discountPercent > 0 ? (
            <Badge tone="discount" className="absolute left-4 top-4 text-sm">
              -{deal.discountPercent}% OFF
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-3 p-7">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-700">
            <Icon name="fire" size={13} />
            Featured deal
          </span>
          <div className="text-sm font-semibold text-slate-500">{deal.merchantName}</div>
          <h2 className="text-xl font-extrabold leading-snug tracking-tight text-ink-800">
            {deal.title}
          </h2>
          {hasPrices ? (
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-ink-900">
                {formatPrice(deal.salePrice!, deal.currency)}
              </span>
              {deal.regularPrice != null && deal.regularPrice > 0 ? (
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(deal.regularPrice, deal.currency)}
                </span>
              ) : null}
            </div>
          ) : null}
          {deal.couponCode ? (
            <Badge tone="coupon" className="w-fit">
              <Icon name="coupon" size={13} />
              Code: {deal.couponCode}
            </Badge>
          ) : null}
          <div className="mt-1">
            <Link href={href}>
              <Button variant="primary" size="lg" className="gap-1.5">
                View deal
                <Icon name="arrow-right" size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
