-- AlterTable
ALTER TABLE "Deal" ADD COLUMN "externalId" TEXT,
ADD COLUMN "source" "SourceKind";

-- CreateIndex
CREATE INDEX "Deal_source_idx" ON "Deal"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_source_externalId_key" ON "Deal"("source", "externalId");
