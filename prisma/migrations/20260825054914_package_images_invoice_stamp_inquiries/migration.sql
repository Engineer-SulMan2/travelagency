-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'CONTACTED', 'CONVERTED', 'CLOSED');

-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "stampUrl" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "createdById" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "productType" "ProductType",
    "details" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiries_agencyId_idx" ON "inquiries"("agencyId");

-- CreateIndex
CREATE INDEX "inquiries_createdById_idx" ON "inquiries"("createdById");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
