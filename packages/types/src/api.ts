import { z } from "zod";
import { OfferStatus } from "./enums.js";

/** Standard pagination query. */
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export const DealSortSchema = z.enum([
  "newest",
  "highest_discount",
  "ending_soon",
  "lowest_price",
  "most_popular",
]);
export type DealSort = z.infer<typeof DealSortSchema>;

/** Filters for the public deals listing. */
export const DealFilterQuery = PaginationQuery.extend({
  store: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minDiscount: z.coerce.number().optional(),
  couponAvailable: z.coerce.boolean().optional(),
  expiresSoon: z.coerce.boolean().optional(),
  verifiedToday: z.coerce.boolean().optional(),
  status: OfferStatus.optional(),
  q: z.string().optional(),
  sort: DealSortSchema.default("newest"),
});
export type DealFilterQuery = z.infer<typeof DealFilterQuery>;

export const SearchQuery = z.object({
  q: z.string().min(1),
  type: z.enum(["deals", "stores", "coupons", "guides"]).default("deals"),
  page: z.coerce.number().int().min(1).default(1),
});
export type SearchQuery = z.infer<typeof SearchQuery>;

/** Generic paginated response wrapper. */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
}

export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
