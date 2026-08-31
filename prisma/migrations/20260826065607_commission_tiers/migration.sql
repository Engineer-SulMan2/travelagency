-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "useCommissionTiers" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "commission_tiers" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minRevenue" DECIMAL(12,2) NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_tiers_agencyId_idx" ON "commission_tiers"("agencyId");

-- AddForeignKey
ALTER TABLE "commission_tiers" ADD CONSTRAINT "commission_tiers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
