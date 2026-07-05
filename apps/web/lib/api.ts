import type { DealCardData } from "@mpf/ui";
import { DealFilterQuery } from "@mpf/types";
import { listDeals, getDealBySlug } from "@/lib/server/deals";
import type { SerializedDeal } from "@/lib/server/serialize";
import { offerRedirectPath } from "@/lib/site";

export type DealDTO = SerializedDeal;

/** Internal click-tracking redirect (same Next.js service). */
export function offerRedirectUrl(offerId: string): string {
  return offerRedirectPath(offerId);
}

function parseDealQuery(query: string) {
  const raw = query.startsWith("?") ? query.slice(1) : query;
  const params = Object.fromEntries(new URLSearchParams(raw));
  const parsed = DealFilterQuery.safeParse(params);
  return parsed.success ? parsed.data : DealFilterQuery.parse({});
}

export async function getDeals(query = ""): Promise<DealDTO[]> {
  const result = await listDeals(parseDealQuery(query));
  return result.data;
}

export async function getDeal(slug: string): Promise<DealDTO | null> {
  return getDealBySlug(slug);
}

export async function getCouponDeals(): Promise<DealDTO[]> {
  const deals = await getDeals("?status=active&couponAvailable=true&pageSize=50");
  return deals.filter((d) => d.couponCode);
}

export function expiryLabel(iso?: string | null): { label: string | null; urgent: boolean } {
  if (!iso) return { label: null, urgent: false };
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 864e5);
  if (diff <= 0) return { label: "Expired", urgent: true };
  if (days <= 1) return { label: "Ends today", urgent: true };
  if (days <= 3) return { label: `${days} days`, urgent: true };
  return { label: `${days} days`, urgent: false };
}

export function toCard(d: DealDTO): DealCardData {
  const e = expiryLabel(d.expiryDate);
  return {
    title: d.title,
    slug: d.slug,
    merchantName: d.merchantName,
    salePrice: d.salePrice,
    regularPrice: d.regularPrice,
    discountPercent: d.discountPercent,
    couponCode: d.couponCode,
    currency: d.currency,
    imageUrl: d.imageUrl,
    expiryLabel: e.label,
    isUrgent: e.urgent,
    confidenceScore: d.confidenceScore,
    verified: Boolean(d.lastVerifiedAt),
  };
}

/** Static store directory until store API is consolidated. */
export const MOCK_STORES = [
  { name: "Best Buy", slug: "best-buy", initials: "BB", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Amazon", slug: "amazon", initials: "AZ", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Walmart", slug: "walmart", initials: "WM", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Target", slug: "target", initials: "TG", dealsCount: 0, couponsCount: 0, verified: true },
  { name: "Nike", slug: "nike", initials: "NK", dealsCount: 0, couponsCount: 0, verified: false },
  { name: "Dell", slug: "dell", initials: "DL", dealsCount: 0, couponsCount: 0, verified: false },
];
