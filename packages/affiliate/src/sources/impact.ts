/**
 * Impact Radius adapter — placeholder only (not in this PR).
 * TODO: implement Impact Partner API → NormalizedOffer + worker CLI.
 */
import type { AffiliateFetchOptions, AffiliateSourceConfig, AffiliateSourceResult } from "../types.js";

export async function fetchImpactOffers(
  _config: AffiliateSourceConfig,
  _options?: AffiliateFetchOptions
): Promise<AffiliateSourceResult> {
  throw new Error("Impact affiliate adapter not implemented yet — see roadmap in README");
}
