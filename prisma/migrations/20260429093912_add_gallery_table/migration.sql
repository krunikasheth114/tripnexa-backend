/*
  Warnings:

  - You are about to drop the column `entityId` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Gallery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gallery" DROP COLUMN "entityId",
DROP COLUMN "type",
ADD COLUMN     "destinationId" INTEGER,
ADD COLUMN     "itineraryId" INTEGER,
ADD COLUMN     "packageId" INTEGER;

-- CreateIndex
CREATE INDEX "Gallery_destinationId_idx" ON "Gallery"("destinationId");

-- CreateIndex
CREATE INDEX "Gallery_packageId_idx" ON "Gallery"("packageId");

-- CreateIndex
CREATE INDEX "Gallery_itineraryId_idx" ON "Gallery"("itineraryId");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
