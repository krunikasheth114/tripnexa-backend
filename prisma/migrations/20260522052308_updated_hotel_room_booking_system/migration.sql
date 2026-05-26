-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalRooms" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "availableMeals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxGuests" INTEGER,
ADD COLUMN     "maxRooms" INTEGER,
ADD COLUMN     "minNights" INTEGER DEFAULT 1,
ADD COLUMN     "perNightPrice" DOUBLE PRECISION;
