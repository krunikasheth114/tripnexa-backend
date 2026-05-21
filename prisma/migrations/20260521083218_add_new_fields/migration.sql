-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "hotelId" INTEGER;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "perNightPrice" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Gallery_hotelId_idx" ON "Gallery"("hotelId");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
