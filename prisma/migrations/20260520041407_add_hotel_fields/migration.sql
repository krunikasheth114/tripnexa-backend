-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "placeId" TEXT;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "destinationId" INTEGER;

-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "destinationId" INTEGER;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "primaryHotelId" INTEGER;

-- CreateIndex
CREATE INDEX "Destination_parentId_idx" ON "Destination"("parentId");

-- CreateIndex
CREATE INDEX "Hotel_destinationId_idx" ON "Hotel"("destinationId");

-- CreateIndex
CREATE INDEX "Itinerary_destinationId_idx" ON "Itinerary"("destinationId");

-- CreateIndex
CREATE INDEX "Package_primaryHotelId_idx" ON "Package"("primaryHotelId");

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_primaryHotelId_fkey" FOREIGN KEY ("primaryHotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
