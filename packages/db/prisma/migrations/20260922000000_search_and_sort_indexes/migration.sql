-- Search + sort indexes for the public read paths.
-- Hand-written and idempotent (IF NOT EXISTS) so it is safe to re-run against an
-- environment where some of these were already applied by hand.

-- Trigram support for the `ILIKE '%q%'` search in searchDealsPostgres(), which cannot use
-- a btree index at all and therefore always sequentially scans Deal + Merchant.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex (GIN trigram — powers the ILIKE '%...%' predicates)
CREATE INDEX IF NOT EXISTS "Deal_title_trgm_idx" ON "Deal" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_brand_trgm_idx" ON "Deal" USING GIN ("brand" gin_trgm_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Merchant_name_trgm_idx" ON "Merchant" USING GIN ("name" gin_trgm_ops);

-- CreateIndex (partial — /coupons and couponAvailable=true only ever want the non-null rows,
-- which are a small fraction of the table)
CREATE INDEX IF NOT EXISTS "Deal_couponCode_partial_idx" ON "Deal" ("couponCode") WHERE "couponCode" IS NOT NULL;

-- Composite indexes matching the new @@index() entries on Deal in schema.prisma. Listing
-- filters on status and then sorts; before this there was no index on createdAt, the
-- default sort, so every page render sorted the whole active set.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_createdAt_idx" ON "Deal" ("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_discountPercent_idx" ON "Deal" ("status", "discountPercent");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_salePrice_idx" ON "Deal" ("status", "salePrice");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_clicksCount_idx" ON "Deal" ("status", "clicksCount");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_expiryDate_idx" ON "Deal" ("status", "expiryDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_updatedAt_idx" ON "Deal" ("status", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_lastVerifiedAt_idx" ON "Deal" ("status", "lastVerifiedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_merchantId_createdAt_idx" ON "Deal" ("status", "merchantId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_categoryId_discountPercent_idx" ON "Deal" ("status", "categoryId", "discountPercent");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_merchantId_status_idx" ON "Deal" ("merchantId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_categoryId_status_idx" ON "Deal" ("categoryId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_status_confidenceScore_idx" ON "Deal" ("status", "confidenceScore");

-- DropIndex (a two-value boolean is never selective enough for the planner to use)
DROP INDEX IF EXISTS "Merchant_isActive_idx";
