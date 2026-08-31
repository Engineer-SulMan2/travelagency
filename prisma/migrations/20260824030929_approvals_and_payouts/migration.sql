-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "approvalThreshold" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "amendedAt" TIMESTAMP(3),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "hotel_bookings" ADD COLUMN     "amendedAt" TIMESTAMP(3),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "package_bookings" ADD COLUMN     "amendedAt" TIMESTAMP(3),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "visa_bookings" ADD COLUMN     "amendedAt" TIMESTAMP(3),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- CreateTable
CREATE TABLE "payout_batches" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "createdById" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_entries" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payout_batches_agencyId_idx" ON "payout_batches"("agencyId");

-- CreateIndex
CREATE INDEX "payout_entries_batchId_idx" ON "payout_entries"("batchId");

-- CreateIndex
CREATE INDEX "payout_entries_userId_idx" ON "payout_entries"("userId");

-- AddForeignKey
ALTER TABLE "payout_entries" ADD CONSTRAINT "payout_entries_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "payout_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
