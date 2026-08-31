-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'AGENCY_ADMIN', 'SUB_AGENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PassengerType" AS ENUM ('ADULT', 'CHILD', 'INFANT');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FLIGHT', 'HOTEL', 'PACKAGE', 'VISA');

-- CreateEnum
CREATE TYPE "PackageCategory" AS ENUM ('HOLIDAY', 'TOUR', 'UMRAH', 'GROUP');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTransactionReason" AS ENUM ('TOPUP', 'BOOKING_PAYMENT', 'COMMISSION_EARNED', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'JAZZCASH', 'EASYPAISA');

-- CreateEnum
CREATE TYPE "VisaType" AS ENUM ('TOURIST', 'BUSINESS', 'STUDENT', 'WORK', 'UMRAH', 'TRANSIT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultMarkupPct" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'SUB_AGENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "agencyId" TEXT,
    "parentId" TEXT,
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "defaultMarkupPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commissionPct" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "cabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "netFare" DECIMAL(12,2) NOT NULL,
    "markupPct" DECIMAL(5,2) NOT NULL,
    "markupAmount" DECIMAL(12,2) NOT NULL,
    "sellingFare" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "PassengerType" NOT NULL DEFAULT 'ADULT',
    "title" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "passportNumber" TEXT,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_entries" (
    "id" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "bookingId" TEXT,
    "hotelBookingId" TEXT,
    "packageBookingId" TEXT,
    "visaBookingId" TEXT,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "markupAmount" DECIMAL(12,2) NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "agencyShare" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "hotelName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "rooms" INTEGER NOT NULL,
    "netFare" DECIMAL(12,2) NOT NULL,
    "markupPct" DECIMAL(5,2) NOT NULL,
    "markupAmount" DECIMAL(12,2) NOT NULL,
    "sellingFare" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_guests" (
    "id" TEXT NOT NULL,
    "hotelBookingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,

    CONSTRAINT "hotel_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "inclusions" TEXT[],
    "basePrice" DECIMAL(12,2) NOT NULL,
    "category" "PackageCategory" NOT NULL DEFAULT 'HOLIDAY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "agencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "packageId" TEXT NOT NULL,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "travelers" INTEGER NOT NULL,
    "leadTravelerName" TEXT NOT NULL,
    "netFare" DECIMAL(12,2) NOT NULL,
    "markupPct" DECIMAL(5,2) NOT NULL,
    "markupAmount" DECIMAL(12,2) NOT NULL,
    "sellingFare" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "reason" "WalletTransactionReason" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" "ProductType",
    "referenceId" TEXT,
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visa_bookings" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "agencyId" TEXT,
    "destinationCountry" TEXT NOT NULL,
    "visaType" "VisaType" NOT NULL,
    "applicants" INTEGER NOT NULL,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "leadApplicantName" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "netFare" DECIMAL(12,2) NOT NULL,
    "markupPct" DECIMAL(5,2) NOT NULL,
    "markupAmount" DECIMAL(12,2) NOT NULL,
    "sellingFare" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visa_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_agencyId_idx" ON "users"("agencyId");

-- CreateIndex
CREATE INDEX "users_parentId_idx" ON "users"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingRef_key" ON "bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_agencyId_idx" ON "bookings"("agencyId");

-- CreateIndex
CREATE INDEX "passengers_bookingId_idx" ON "passengers"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_entries_bookingId_key" ON "commission_entries"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_entries_hotelBookingId_key" ON "commission_entries"("hotelBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_entries_packageBookingId_key" ON "commission_entries"("packageBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_entries_visaBookingId_key" ON "commission_entries"("visaBookingId");

-- CreateIndex
CREATE INDEX "commission_entries_userId_idx" ON "commission_entries"("userId");

-- CreateIndex
CREATE INDEX "commission_entries_agencyId_idx" ON "commission_entries"("agencyId");

-- CreateIndex
CREATE INDEX "commission_entries_productType_idx" ON "commission_entries"("productType");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_bookings_bookingRef_key" ON "hotel_bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "hotel_bookings_userId_idx" ON "hotel_bookings"("userId");

-- CreateIndex
CREATE INDEX "hotel_bookings_agencyId_idx" ON "hotel_bookings"("agencyId");

-- CreateIndex
CREATE INDEX "hotel_guests_hotelBookingId_idx" ON "hotel_guests"("hotelBookingId");

-- CreateIndex
CREATE INDEX "packages_agencyId_idx" ON "packages"("agencyId");

-- CreateIndex
CREATE INDEX "packages_category_idx" ON "packages"("category");

-- CreateIndex
CREATE UNIQUE INDEX "package_bookings_bookingRef_key" ON "package_bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "package_bookings_userId_idx" ON "package_bookings"("userId");

-- CreateIndex
CREATE INDEX "package_bookings_agencyId_idx" ON "package_bookings"("agencyId");

-- CreateIndex
CREATE INDEX "package_bookings_packageId_idx" ON "package_bookings"("packageId");

-- CreateIndex
CREATE INDEX "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_referenceType_referenceId_idx" ON "wallet_transactions"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "visa_bookings_bookingRef_key" ON "visa_bookings"("bookingRef");

-- CreateIndex
CREATE INDEX "visa_bookings_userId_idx" ON "visa_bookings"("userId");

-- CreateIndex
CREATE INDEX "visa_bookings_agencyId_idx" ON "visa_bookings"("agencyId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_hotelBookingId_fkey" FOREIGN KEY ("hotelBookingId") REFERENCES "hotel_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_packageBookingId_fkey" FOREIGN KEY ("packageBookingId") REFERENCES "package_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_visaBookingId_fkey" FOREIGN KEY ("visaBookingId") REFERENCES "visa_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_guests" ADD CONSTRAINT "hotel_guests_hotelBookingId_fkey" FOREIGN KEY ("hotelBookingId") REFERENCES "hotel_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_bookings" ADD CONSTRAINT "package_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_bookings" ADD CONSTRAINT "package_bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visa_bookings" ADD CONSTRAINT "visa_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
