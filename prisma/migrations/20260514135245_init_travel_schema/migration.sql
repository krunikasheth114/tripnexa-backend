/*
  Warnings:

  - You are about to drop the column `activities` on the `Itinerary` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[packageId,dayNumber]` on the table `Itinerary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Package` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('AIRPORT_PICKUP', 'AIRPORT_DROP', 'RAILWAY_PICKUP', 'RAILWAY_DROP', 'HOTEL_TRANSFER', 'SIGHTSEEING_TRANSFER', 'PRIVATE_CAB', 'VOLVO_BUS');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ADVENTURE', 'SIGHTSEEING', 'TREKKING', 'WATERSPORT', 'RELAXATION', 'CAMPFIRE', 'SHOPPING', 'BOATING', 'SAFARI');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "seasonalTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "slug" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Itinerary" DROP COLUMN "activities";

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "description" TEXT,
ADD COLUMN     "extraExclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extraInclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slug" TEXT;

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "GalleryType";

-- CreateTable
CREATE TABLE "Hotel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "starRating" INTEGER,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryHotel" (
    "id" SERIAL NOT NULL,
    "itineraryId" INTEGER NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "checkIn" BOOLEAN NOT NULL DEFAULT false,
    "checkOut" BOOLEAN NOT NULL DEFAULT false,
    "roomType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryHotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryActivity" (
    "id" SERIAL NOT NULL,
    "itineraryId" INTEGER NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryTransfer" (
    "id" SERIAL NOT NULL,
    "itineraryId" INTEGER NOT NULL,
    "transferType" "TransferType" NOT NULL,
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "pickupTime" TIMESTAMP(3),
    "dropTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryMeal" (
    "id" SERIAL NOT NULL,
    "itineraryId" INTEGER NOT NULL,
    "mealType" "MealType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItineraryHotel_itineraryId_idx" ON "ItineraryHotel"("itineraryId");

-- CreateIndex
CREATE INDEX "ItineraryHotel_hotelId_idx" ON "ItineraryHotel"("hotelId");

-- CreateIndex
CREATE INDEX "ItineraryActivity_itineraryId_idx" ON "ItineraryActivity"("itineraryId");

-- CreateIndex
CREATE INDEX "ItineraryTransfer_itineraryId_idx" ON "ItineraryTransfer"("itineraryId");

-- CreateIndex
CREATE INDEX "ItineraryMeal_itineraryId_idx" ON "ItineraryMeal"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryMeal_itineraryId_mealType_key" ON "ItineraryMeal"("itineraryId", "mealType");

-- CreateIndex
CREATE INDEX "Itinerary_packageId_idx" ON "Itinerary"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_packageId_dayNumber_key" ON "Itinerary"("packageId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE INDEX "Package_destinationId_idx" ON "Package"("destinationId");

-- AddForeignKey
ALTER TABLE "ItineraryHotel" ADD CONSTRAINT "ItineraryHotel_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryHotel" ADD CONSTRAINT "ItineraryHotel_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryActivity" ADD CONSTRAINT "ItineraryActivity_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryTransfer" ADD CONSTRAINT "ItineraryTransfer_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryMeal" ADD CONSTRAINT "ItineraryMeal_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
