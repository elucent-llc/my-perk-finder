import type { NormalizedOffer } from "@mpf/affiliate/types";
import type { OfferStatus, ValidationFlag } from "@mpf/types";

export interface OfferImportValidation {
  flags: ValidationFlag[];
  confidenceScore: number;
  /** Recommended DB status after validation. */
  status: OfferStatus;
  /** Hard reject — do not upsert. */
  rejected: boolean;
}

const LOW_CONFIDENCE_THRESHOLD = 0.65;
const HIGH_DISCOUNT_THRESHOLD = 85;
const MIN_CONFIDENCE_FOR_ACTIVE = 0.8;

/**
 * Validate a normalized affiliate offer before DB upsert.
 * Checks missing affiliate URL, missing merchant, expired date,
 * invalid price, suspicious discount, and low confidence.
 */
export function validateOfferForImport(offer: NormalizedOffer): OfferImportValidation {
  const flags: ValidationFlag[] = [];
  let confidence = offer.confidenceScore;

  if (!offer.affiliateUrl || offer.affiliateUrl.trim() === "") {
    flags.push("missing_affiliate_url");
    confidence = Math.min(confidence, 0.5);
  }

  if (!offer.merchantName || offer.merchantName.trim() === "") {
    flags.push("missing_merchant");
    confidence = Math.min(confidence, 0.55);
  }

  if (!offer.category || offer.category.trim() === "") {
    flags.push("missing_category");
    confidence = Math.min(confidence, 0.7);
  }

  if (offer.expiryDate && offer.expiryDate.getTime() < Date.now()) {
    flags.push("expired_date");
    confidence = Math.min(confidence, 0.4);
  }

  if (offer.salePrice <= 0 || offer.regularPrice <= 0) {
    // Invalid price if both zero; allow coupon-only promos with sale=0 if affiliate URL exists
    if (offer.salePrice <= 0 && offer.regularPrice <= 0 && !offer.couponCode) {
      flags.push("sale_higher_than_regular"); // reuse flag bucket for invalid pricing
    }
  }

  if (offer.regularPrice > 0 && offer.salePrice > offer.regularPrice) {
    flags.push("sale_higher_than_regular");
    confidence = Math.min(confidence, 0.35);
  }

  if (offer.discountPercent >= HIGH_DISCOUNT_THRESHOLD) {
    flags.push("discount_too_high");
    confidence = Math.min(confidence, 0.6);
  }

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    flags.push("low_confidence_score");
  }

  const hasHardReject =
    flags.includes("sale_higher_than_regular") &&
    offer.regularPrice > 0 &&
    offer.salePrice > offer.regularPrice;

  let status: OfferStatus = "active";
  if (hasHardReject) {
    status = "rejected";
  } else if (
    flags.includes("expired_date") ||
    flags.includes("missing_affiliate_url") ||
    flags.includes("missing_merchant") ||
    confidence < LOW_CONFIDENCE_THRESHOLD ||
    flags.includes("discount_too_high")
  ) {
    status = "needs_review";
  } else if (confidence >= MIN_CONFIDENCE_FOR_ACTIVE && flags.length === 0) {
    status = "active";
  } else if (flags.includes("missing_category")) {
    status = "needs_review";
  }

  return {
    flags,
    confidenceScore: confidence,
    status,
    rejected: status === "rejected",
  };
}
