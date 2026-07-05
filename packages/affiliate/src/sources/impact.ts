import type { AffiliateFetchOptions, AffiliateSourceConfig, AffiliateSourceResult } from "../types.js";

/** Impact affiliate adapter — not implemented yet. */
export async function fetchImpactOffers(
  _config: AffiliateSourceConfig,
  _options?: AffiliateFetchOptions
): Promise<AffiliateSourceResult> {
  throw new Error("Impact affiliate adapter not implemented yet");
}
