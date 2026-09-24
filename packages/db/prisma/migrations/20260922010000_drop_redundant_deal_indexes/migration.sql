-- Drop single-column Deal indexes that are now redundant.
--
-- Each of these is the leftmost prefix of a wider index added in
-- 20260922000000_search_and_sort_indexes (or of the @@unique([source, externalId]) index that
-- has always been there), so Postgres can serve the same lookups from the wider index and has
-- no reason to pick the narrow one:
--
--   Deal_status_idx      ⊂ Deal_status_createdAt_idx (and six other (status, …) composites)
--   Deal_merchantId_idx  ⊂ Deal_merchantId_status_idx
--   Deal_categoryId_idx  ⊂ Deal_categoryId_status_idx
--   Deal_source_idx      ⊂ Deal_source_externalId_key
--
-- Deal is bulk-upserted by the affiliate import worker and every index on the table is
-- re-written for each upserted row, so these cost write throughput on the hot path while
-- contributing nothing to reads.
--
-- Idempotent (IF EXISTS), matching the style of the previous migration, so it is safe to
-- re-run against an environment where some were already removed by hand.

-- DropIndex
DROP INDEX IF EXISTS "Deal_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "Deal_merchantId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Deal_categoryId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Deal_source_idx";
