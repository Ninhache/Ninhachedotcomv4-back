/*
  Warnings:

  - You are about to drop the column `companyName` on the `ExperienceTranslation` table. All the data in the column will be lost.
  - Added the required column `companyName` to the `Experience` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "companyName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExperienceTranslation" DROP COLUMN "companyName";
