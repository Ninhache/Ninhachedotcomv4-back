/*
  Warnings:

  - Added the required column `isVisible` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVisible` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVisible` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVisible` to the `Skill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hexColor` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVisible` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "isVisible" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "isVisible" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isVisible" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "isVisible" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "hexColor" TEXT NOT NULL,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SkillToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SkillToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_name_key" ON "SkillCategory"("name");

-- CreateIndex
CREATE INDEX "_SkillToCategory_B_index" ON "_SkillToCategory"("B");

-- AddForeignKey
ALTER TABLE "_SkillToCategory" ADD CONSTRAINT "_SkillToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillToCategory" ADD CONSTRAINT "_SkillToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "SkillCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
