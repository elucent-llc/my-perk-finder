/**
 * Rakuten Advertising adapter — placeholder only (not in this PR).
 * TODO: implement Rakuten Publisher API → NormalizedOffer + worker CLI.
 */
import type { AffiliateFetchOptions, AffiliateSourceConfig, AffiliateSourceResult } from "../types.js";

export async function fetchRakutenOffers(
  _config: AffiliateSourceConfig,
  _options?: AffiliateFetchOptions
): Promise<AffiliateSourceResult> {
  throw new Error("Rakuten affiliate adapter not implemented yet — see roadmap in README");
}
