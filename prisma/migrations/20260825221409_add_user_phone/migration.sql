/*
  Warnings:

  - You are about to drop the column `maxSeats` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the `booking_notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "packages" DROP COLUMN "maxSeats";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "booking_notes";
