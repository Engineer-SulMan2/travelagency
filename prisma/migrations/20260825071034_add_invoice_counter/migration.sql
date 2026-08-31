-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "flightCancellationPolicy" TEXT,
ADD COLUMN     "hotelCancellationPolicy" TEXT,
ADD COLUMN     "invoiceCounter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "packageCancellationPolicy" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "visaCancellationPolicy" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "invoiceNumber" INTEGER;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "hotel_bookings" ADD COLUMN     "invoiceNumber" INTEGER;

-- AlterTable
ALTER TABLE "package_bookings" ADD COLUMN     "invoiceNumber" INTEGER;

-- AlterTable
ALTER TABLE "visa_bookings" ADD COLUMN     "invoiceNumber" INTEGER;

-- CreateTable
CREATE TABLE "sub_agent_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_agent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sub_agent_documents_userId_idx" ON "sub_agent_documents"("userId");

-- CreateIndex
CREATE INDEX "sub_agent_documents_agencyId_idx" ON "sub_agent_documents"("agencyId");

-- AddForeignKey
ALTER TABLE "sub_agent_documents" ADD CONSTRAINT "sub_agent_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
