/*
  Warnings:

  - You are about to drop the column `accommodationType` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `extraExclusions` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `extraInclusions` on the `Package` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Package" DROP COLUMN "accommodationType",
DROP COLUMN "extraExclusions",
DROP COLUMN "extraInclusions",
ADD COLUMN     "exclusions" JSONB,
ADD COLUMN     "inclusions" JSONB;
