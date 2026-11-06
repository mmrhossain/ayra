-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "stockUpdatedAt" TIMESTAMP(3);
