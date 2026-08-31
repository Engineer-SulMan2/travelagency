-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "tripType" "TripType" NOT NULL DEFAULT 'ONE_WAY';

-- CreateTable
CREATE TABLE "flight_legs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "legOrder" INTEGER NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_legs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_legs_bookingId_idx" ON "flight_legs"("bookingId");

-- AddForeignKey
ALTER TABLE "flight_legs" ADD CONSTRAINT "flight_legs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
