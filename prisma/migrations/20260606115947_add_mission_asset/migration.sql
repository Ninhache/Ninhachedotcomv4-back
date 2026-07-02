-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "assetId" TEXT;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
