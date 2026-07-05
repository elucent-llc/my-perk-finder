import type { AffiliateFetchOptions, AffiliateSourceConfig, AffiliateSourceResult } from "../types.js";

/** CJ Affiliate adapter — not implemented yet. */
export async function fetchCjOffers(
  _config: AffiliateSourceConfig,
  _options?: AffiliateFetchOptions
): Promise<AffiliateSourceResult> {
  throw new Error("CJ affiliate adapter not implemented yet");
}
