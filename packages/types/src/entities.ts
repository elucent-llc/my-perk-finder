import { z } from "zod";
import { ImportStatus, RawRecordStatus, SourceKind, SubscriberStatus } from "./enums.js";

export const MerchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().url().nullable().optional(),
  network: SourceKind.nullable().optional(),
  homepageUrl: z.string().url().nullable().optional(),
  commissionRate: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
  activeDealsCount: z.number().int().nonnegative().default(0),
  activeCouponsCount: z.number().int().nonnegative().default(0),
});
export type Merchant = z.infer<typeof MerchantSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  mappingKeywords: z.array(z.string()).default([]),
});
export type Category = z.infer<typeof CategorySchema>;

export const CouponSchema = z.object({
  id: z.string(),
  merchantName: z.string(),
  title: z.string(),
  code: z.string().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
  revealCount: z.number().int().nonnegative().default(0),
});
export type Coupon = z.infer<typeof CouponSchema>;

export const ImportJobSchema = z.object({
  id: z.string(),
  source: SourceKind,
  status: ImportStatus,
  startedAt: z.coerce.date().nullable().optional(),
  finishedAt: z.coerce.date().nullable().optional(),
  offersFound: z.number().int().nonnegative().default(0),
  created: z.number().int().nonnegative().default(0),
  updated: z.number().int().nonnegative().default(0),
  rejected: z.number().int().nonnegative().default(0),
  needsReview: z.number().int().nonnegative().default(0),
  error: z.string().nullable().optional(),
});
export type ImportJob = z.infer<typeof ImportJobSchema>;

export const RawRecordSchema = z.object({
  id: z.string(),
  source: SourceKind,
  payload: z.record(z.unknown()),
  normalized: z.record(z.unknown()).nullable().optional(),
  status: RawRecordStatus,
  importedAt: z.coerce.date(),
});
export type RawRecord = z.infer<typeof RawRecordSchema>;

export const SubscriberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  status: SubscriberStatus,
  dailyDigest: z.boolean().default(false),
  alerts: z.boolean().default(false),
  categoryPreferences: z.array(z.string()).default([]),
  createdAt: z.coerce.date(),
});
export type Subscriber = z.infer<typeof SubscriberSchema>;
