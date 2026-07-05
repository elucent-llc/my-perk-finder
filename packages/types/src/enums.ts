import { z } from "zod";

/** Lifecycle status of an offer. */
export const OfferStatus = z.enum([
  "draft",
  "active",
  "expired",
  "needs_review",
  "rejected",
  "archived",
]);
export type OfferStatus = z.infer<typeof OfferStatus>;

/** Status of an affiliate import job. */
export const ImportStatus = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "partial_success",
]);
export type ImportStatus = z.infer<typeof ImportStatus>;

/** Processing status of a single raw imported record. */
export const RawRecordStatus = z.enum([
  "pending",
  "processed",
  "failed",
]);
export type RawRecordStatus = z.infer<typeof RawRecordStatus>;

/** Validation flags surfaced during import/review. */
export const ValidationFlag = z.enum([
  "missing_affiliate_url",
  "expired_date",
  "discount_too_high",
  "sale_higher_than_regular",
  "missing_merchant",
  "missing_category",
  "low_confidence_score",
  "possible_duplicate",
]);
export type ValidationFlag = z.infer<typeof ValidationFlag>;

/** Human-readable labels for validation flags (used in admin UI). */
export const VALIDATION_FLAG_LABELS: Record<ValidationFlag, string> = {
  missing_affiliate_url: "Missing affiliate URL",
  expired_date: "Expired date",
  discount_too_high: "Discount too high",
  sale_higher_than_regular: "Sale price higher than regular price",
  missing_merchant: "Missing merchant",
  missing_category: "Missing category",
  low_confidence_score: "Low confidence score",
  possible_duplicate: "Possible duplicate",
};

/** Affiliate source / network identifiers. */
export const SourceKind = z.enum([
  "cj",
  "rakuten",
  "impact",
  "awin",
  "walmart",
  "ebay",
  "feed_aggregator",
  "merchant_email",
]);
export type SourceKind = z.infer<typeof SourceKind>;

export const SubscriberStatus = z.enum([
  "confirmed",
  "unconfirmed",
  "bounced",
  "unsubscribed",
]);
export type SubscriberStatus = z.infer<typeof SubscriberStatus>;
