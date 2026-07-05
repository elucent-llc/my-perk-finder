import { z } from "zod";
import { OfferStatus, ValidationFlag } from "./enums.js";

/** Core deal/offer entity — matches the fields shown across the wireframes. */
export const DealSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  slug: z.string(),
  merchantName: z.string(),
  category: z.string(),
  brand: z.string().nullable().optional(),
  regularPrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100),
  couponCode: z.string().nullable().optional(),
  currency: z.string().default("USD"),
  imageUrl: z.string().url().nullable().optional(),
  affiliateUrl: z.string().url().nullable().optional(),
  productUrl: z.string().url().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  lastVerifiedAt: z.coerce.date().nullable().optional(),
  sourceName: z.string().nullable().optional(),
  status: OfferStatus,
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Deal = z.infer<typeof DealSchema>;

/** Payload for creating an offer (admin form / import normalization). */
export const CreateDealSchema = DealSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  slug: true,
  status: true,
  discountPercent: true,
  confidenceScore: true,
});
export type CreateDeal = z.infer<typeof CreateDealSchema>;

export const UpdateDealSchema = CreateDealSchema.partial();
export type UpdateDeal = z.infer<typeof UpdateDealSchema>;

/** A single validation finding attached to a deal during review. */
export const DealValidationSchema = z.object({
  flag: ValidationFlag,
  severity: z.enum(["info", "warning", "error"]),
  message: z.string(),
});
export type DealValidation = z.infer<typeof DealValidationSchema>;
