-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
