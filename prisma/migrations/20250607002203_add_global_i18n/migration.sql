/*
  Warnings:

  - You are about to drop the column `image` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `SkillCategory` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Tag` table. All the data in the column will be lost.
  - Added the required column `contactUrl` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractType` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `localisation` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrl` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('Permanent', 'Fixed', 'Internship', 'Workstudy', 'Freelance');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('fr', 'en');

-- DropIndex
DROP INDEX "SkillCategory_name_key";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "image",
DROP COLUMN "text",
DROP COLUMN "url",
ADD COLUMN     "contactUrl" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "companyName",
DROP COLUMN "date",
DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "contractType" "ContractType" NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "localisation" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "url",
ADD COLUMN     "mediaUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "description",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "url";

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "SkillCategory" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "name";

-- CreateTable
CREATE TABLE "ProjectTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "SkillTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCategoryTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "skillCategoryId" TEXT NOT NULL,

    CONSTRAINT "SkillCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,

    CONSTRAINT "ExperienceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "text" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "ContactTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "url" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "ResumeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTranslation_projectId_locale_key" ON "ProjectTranslation"("projectId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "TagTranslation_tagId_locale_key" ON "TagTranslation"("tagId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTranslation_skillId_locale_key" ON "SkillTranslation"("skillId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategoryTranslation_skillCategoryId_locale_key" ON "SkillCategoryTranslation"("skillCategoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceTranslation_experienceId_locale_key" ON "ExperienceTranslation"("experienceId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ContactTranslation_contactId_locale_key" ON "ContactTranslation"("contactId", "locale");

-- AddForeignKey
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagTranslation" ADD CONSTRAINT "TagTranslation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTranslation" ADD CONSTRAINT "SkillTranslation_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCategoryTranslation" ADD CONSTRAINT "SkillCategoryTranslation_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "SkillCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTranslation" ADD CONSTRAINT "ExperienceTranslation_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactTranslation" ADD CONSTRAINT "ContactTranslation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTranslation" ADD CONSTRAINT "ResumeTranslation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
