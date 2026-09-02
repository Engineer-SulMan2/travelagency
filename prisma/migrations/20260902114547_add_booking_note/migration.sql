-- CreateTable
CREATE TABLE "booking_notes" (
    "id" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "agencyId" TEXT,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_notes_productType_referenceId_idx" ON "booking_notes"("productType", "referenceId");

-- CreateIndex
CREATE INDEX "booking_notes_agencyId_idx" ON "booking_notes"("agencyId");

-- CreateIndex
CREATE INDEX "booking_notes_authorId_idx" ON "booking_notes"("authorId");
