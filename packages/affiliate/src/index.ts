export * from "./types.js";
export { fetchAwinOffers, normalizeAwinPromotion } from "./sources/awin.js";
export { fetchCjOffers, normalizeCjLink } from "./sources/cj.js";
export type { CjSourceConfig, CjRelationshipStatus } from "./sources/cj.js";
export { fetchWalmartOffers, normalizeWalmartItem } from "./sources/walmart.js";
export type { WalmartSourceConfig } from "./sources/walmart.js";
export { fetchImpactOffers } from "./sources/impact.js";
export { fetchRakutenOffers } from "./sources/rakuten.js";
export { fetchEbayOffers } from "./sources/ebay.js";
