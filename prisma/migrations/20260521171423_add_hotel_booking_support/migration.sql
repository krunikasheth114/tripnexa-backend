-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('PACKAGE', 'HOTEL');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_packageId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingType" "BookingType" NOT NULL DEFAULT 'PACKAGE',
ADD COLUMN     "checkInDate" TIMESTAMP(3),
ADD COLUMN     "checkOutDate" TIMESTAMP(3),
ADD COLUMN     "hotelId" INTEGER,
ADD COLUMN     "totalRooms" INTEGER,
ALTER COLUMN "packageId" DROP NOT NULL,
ALTER COLUMN "travelDate" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_hotelId_idx" ON "Booking"("hotelId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
