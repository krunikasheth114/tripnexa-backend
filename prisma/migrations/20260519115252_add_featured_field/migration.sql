/*
  Warnings:

  - You are about to drop the column `featured` on the `Destination` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Destination" DROP COLUMN "featured";

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
