import type { NormalizedOffer } from "@mpf/affiliate/types";
import type { OfferStatus, ValidationFlag } from "@mpf/types";

export interface OfferImportValidation {
  flags: ValidationFlag[];
  confidenceScore: number;
  status: OfferStatus;
  /** Hard reject — do not upsert. */
  rejected: boolean;
}

const LOW_CONFIDENCE_THRESHOLD = 0.65;
const HIGH_DISCOUNT_THRESHOLD = 85;

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate a normalized affiliate offer before DB upsert.
 */
export function validateOfferForImport(offer: NormalizedOffer): OfferImportValidation {
  const flags: ValidationFlag[] = [];
  let confidence = offer.confidenceScore;

  const affiliateUrl = offer.affiliateUrl?.trim() ?? "";
  if (!affiliateUrl || !isValidHttpUrl(affiliateUrl)) {
    flags.push("missing_affiliate_url");
    return {
      flags,
      confidenceScore: 0,
      status: "rejected",
      rejected: true,
    };
  }

  if (!offer.merchantName || offer.merchantName.trim() === "") {
    flags.push("missing_merchant");
    return {
      flags,
      confidenceScore: 0,
      status: "rejected",
      rejected: true,
    };
  }

  const title = offer.title?.trim() ?? "";
  if (!title) {
    flags.push("missing_title");
    return {
      flags,
      confidenceScore: 0,
      status: "rejected",
      rejected: true,
    };
  }

  if (offer.expiryDate instanceof Date && Number.isNaN(offer.expiryDate.getTime())) {
    flags.push("expired_date");
    return {
      flags,
      confidenceScore: 0,
      status: "rejected",
      rejected: true,
    };
  }

  if (offer.expiryDate && offer.expiryDate.getTime() < Date.now()) {
    flags.push("expired_date");
    return {
      flags,
      confidenceScore: Math.min(confidence, 0.4),
      status: "expired",
      rejected: false,
    };
  }

  if (!offer.category || offer.category.trim() === "") {
    flags.push("missing_category");
    confidence = Math.min(confidence, 0.7);
  }

  const regular = offer.regularPrice ?? 0;
  const sale = offer.salePrice ?? 0;
  const isCouponOnly = Boolean(offer.couponCode) && regular <= 0 && sale <= 0;

  if (!isCouponOnly && regular > 0 && sale > regular) {
    flags.push("sale_higher_than_regular");
    return {
      flags,
      confidenceScore: Math.min(confidence, 0.35),
      status: "rejected",
      rejected: true,
    };
  }

  if (offer.discountPercent >= HIGH_DISCOUNT_THRESHOLD) {
    flags.push("discount_too_high");
    confidence = Math.min(confidence, 0.6);
  }

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    flags.push("low_confidence_score");
  }

  let status: OfferStatus = "active";
  if (flags.includes("discount_too_high") || flags.includes("low_confidence_score") || flags.includes("missing_category")) {
    status = "needs_review";
  } else if (flags.length === 0 && confidence >= 0.8) {
    status = "active";
  } else if (flags.includes("missing_category")) {
    status = "needs_review";
  }

  return {
    flags,
    confidenceScore: confidence,
    status,
    rejected: false,
  };
}
