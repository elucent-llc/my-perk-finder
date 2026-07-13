/**
 * eBay Partner Network adapter — placeholder only (not in this PR).
 * TODO: implement eBay Browse/Affiliate API → NormalizedOffer + worker CLI.
 */
import type { AffiliateFetchOptions, AffiliateSourceConfig, AffiliateSourceResult } from "../types.js";

export async function fetchEbayOffers(
  _config: AffiliateSourceConfig,
  _options?: AffiliateFetchOptions
): Promise<AffiliateSourceResult> {
  throw new Error("eBay affiliate adapter not implemented yet — see roadmap in README");
}
