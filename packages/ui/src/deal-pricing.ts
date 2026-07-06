export interface DealPricingInput {
  salePrice?: number | null;
  regularPrice?: number | null;
  couponCode?: string | null;
}

export function hasDisplayablePrices(deal: DealPricingInput): boolean {
  const sale = deal.salePrice;
  const regular = deal.regularPrice;
  return (sale != null && sale > 0) || (regular != null && regular > 0);
}

export function computeSavings(deal: DealPricingInput): number | null {
  const sale = deal.salePrice;
  const regular = deal.regularPrice;
  if (sale == null || regular == null || sale <= 0 || regular <= 0 || sale >= regular) {
    return null;
  }
  return regular - sale;
}

export function priceFallbackLabel(deal: DealPricingInput): string {
  if (deal.couponCode) return "Promotion offer";
  return "See merchant site";
}
