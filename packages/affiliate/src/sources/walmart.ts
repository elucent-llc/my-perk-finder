import type { AffiliateFetchOptions, AffiliateSourceConfig, AffiliateSourceResult } from "../types.js";

/** Walmart affiliate adapter — not implemented yet. */
export async function fetchWalmartOffers(
  _config: AffiliateSourceConfig,
  _options?: AffiliateFetchOptions
): Promise<AffiliateSourceResult> {
  throw new Error("Walmart affiliate adapter not implemented yet");
}
