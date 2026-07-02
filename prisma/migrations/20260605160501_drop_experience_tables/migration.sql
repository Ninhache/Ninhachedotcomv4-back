-- AlterEnum
BEGIN;
CREATE TYPE "TagType_new" AS ENUM ('TECH', 'QUAL', 'SKILL_CATEGORY', 'MISSION_TECH');
ALTER TABLE "Tag" ALTER COLUMN "type" TYPE "TagType_new" USING ("type"::text::"TagType_new");
ALTER TYPE "TagType" RENAME TO "TagType_old";
ALTER TYPE "TagType_new" RENAME TO "TagType";
DROP TYPE "TagType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ExperienceTranslation" DROP CONSTRAINT "ExperienceTranslation_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "_ExperienceTags" DROP CONSTRAINT "_ExperienceTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExperienceTags" DROP CONSTRAINT "_ExperienceTags_B_fkey";

-- DropTable
DROP TABLE "Experience";

-- DropTable
DROP TABLE "ExperienceTranslation";

-- DropTable
DROP TABLE "_ExperienceTags";
