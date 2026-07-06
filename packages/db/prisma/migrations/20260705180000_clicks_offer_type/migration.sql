-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('product', 'coupon', 'promotion', 'sale');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN "offerType" "OfferType" NOT NULL DEFAULT 'product',
ALTER COLUMN "regularPrice" DROP NOT NULL,
ALTER COLUMN "salePrice" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Click_dealId_idx" ON "Click"("dealId");

-- CreateIndex
CREATE INDEX "Click_createdAt_idx" ON "Click"("createdAt");

-- CreateIndex
CREATE INDEX "Deal_offerType_idx" ON "Deal"("offerType");

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
