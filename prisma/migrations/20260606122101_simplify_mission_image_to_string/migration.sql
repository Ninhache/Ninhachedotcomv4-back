/*
  Warnings:

  - You are about to drop the column `assetId` on the `Mission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_assetId_fkey";

-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "assetId",
ADD COLUMN     "imageUrl" TEXT;
