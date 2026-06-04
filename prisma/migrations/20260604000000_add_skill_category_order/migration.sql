-- Skill category ordering + per-category skill ordering.

-- 1. Display order of categories (existing rows default to 0).
ALTER TABLE "SkillCategory" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- 2. Explicit join table carrying the per-category order of each skill,
--    replacing the implicit m2m "_SkillToCategory".
CREATE TABLE "SkillOnCategory" (
    "skillId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SkillOnCategory_pkey" PRIMARY KEY ("skillId", "categoryId")
);
CREATE INDEX "SkillOnCategory_categoryId_idx" ON "SkillOnCategory"("categoryId");
ALTER TABLE "SkillOnCategory" ADD CONSTRAINT "SkillOnCategory_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillOnCategory" ADD CONSTRAINT "SkillOnCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "SkillCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Backfill existing memberships (A = Skill, B = SkillCategory), order 0.
INSERT INTO "SkillOnCategory" ("skillId", "categoryId", "order")
SELECT "A", "B", 0 FROM "_SkillToCategory";

-- 4. Drop the old implicit join table.
DROP TABLE "_SkillToCategory";
