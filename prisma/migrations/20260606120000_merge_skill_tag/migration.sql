-- Merge Tag into Skill + replace QUAL tags with a ProjectNature enum.
-- See docs/specs/skill-tag-merge.md (frontend repo) / ADR 0001.
--
-- Order is critical: create the new structures, MIGRATE THE DATA, then drop the
-- old tag tables. New ids are derived with md5() from the source row id so they
-- are unique and require no extension (no gen_random_uuid dependency).

-- 1. New enum (project natures, formerly QUAL tags) --------------------------
CREATE TYPE "ProjectNature" AS ENUM ('SCHOOL', 'PERSONAL', 'WEB', 'SIMULATIONS', 'DATE', 'RANDOM');

-- 2. New columns -------------------------------------------------------------
ALTER TABLE "Project" ADD COLUMN "natures" "ProjectNature"[];
ALTER TABLE "Skill" ALTER COLUMN "image" DROP NOT NULL;

-- 3. New skill join tables (data filled in step 4, FKs added in step 5) ------
CREATE TABLE "_ProjectSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProjectSkills_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE TABLE "_CompanySkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CompanySkills_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE TABLE "_MissionSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MissionSkills_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_ProjectSkills_B_index" ON "_ProjectSkills"("B");
CREATE INDEX "_CompanySkills_B_index" ON "_CompanySkills"("B");
CREATE INDEX "_MissionSkills_B_index" ON "_MissionSkills"("B");

-- 4. DATA MIGRATION ----------------------------------------------------------
-- 4a. Matched TECH/MISSION_TECH tags -> existing skill, deduped by EN name.
CREATE TEMP TABLE _tag_skill_map (tag_id TEXT PRIMARY KEY, skill_id TEXT NOT NULL);

INSERT INTO _tag_skill_map (tag_id, skill_id)
SELECT DISTINCT ON (t.id) t.id, st."skillId"
FROM "Tag" t
JOIN "TagTranslation" tt ON tt."tagId" = t.id AND tt.locale = 'en'
JOIN "SkillTranslation" st ON st.locale = 'en'
    AND lower(trim(st.name)) = lower(trim(tt.name))
WHERE t.type IN ('TECH','MISSION_TECH')
ORDER BY t.id, st."skillId";

-- 4b. Unmatched TECH/MISSION_TECH tags -> brand-new skills (image/wikiUrl NULL).
CREATE TEMP TABLE _new_skill (tag_id TEXT PRIMARY KEY, skill_id TEXT NOT NULL);

INSERT INTO _new_skill (tag_id, skill_id)
SELECT t.id, 'mig_' || md5(t.id)
FROM "Tag" t
WHERE t.type IN ('TECH','MISSION_TECH')
    AND NOT EXISTS (SELECT 1 FROM _tag_skill_map m WHERE m.tag_id = t.id);

INSERT INTO "Skill" (id, image, "wikiUrl", "isVisible")
SELECT ns.skill_id, NULL, NULL, t."isVisible"
FROM _new_skill ns JOIN "Tag" t ON t.id = ns.tag_id;

INSERT INTO "SkillTranslation" (id, locale, name, "skillId")
SELECT 'migt_' || md5(tt.id), tt.locale, tt.name, ns.skill_id
FROM _new_skill ns JOIN "TagTranslation" tt ON tt."tagId" = ns.tag_id;

INSERT INTO _tag_skill_map (tag_id, skill_id)
SELECT tag_id, skill_id FROM _new_skill;

-- 4c. Re-point the project/mission/company tech-tag joins onto skills.
INSERT INTO "_ProjectSkills" ("A","B")
SELECT j."A", m.skill_id
FROM "_ProjectTechTags" j JOIN _tag_skill_map m ON m.tag_id = j."B"
ON CONFLICT DO NOTHING;

INSERT INTO "_MissionSkills" ("A","B")
SELECT j."A", m.skill_id
FROM "_MissionTechTags" j JOIN _tag_skill_map m ON m.tag_id = j."B"
ON CONFLICT DO NOTHING;

INSERT INTO "_CompanySkills" ("A","B")
SELECT j."A", m.skill_id
FROM "_CompanyTags" j JOIN _tag_skill_map m ON m.tag_id = j."B"
ON CONFLICT DO NOTHING;

-- 4d. QUAL tags -> Project.natures (array of enum values, by EN name).
UPDATE "Project" p
SET natures = sub.arr
FROM (
    SELECT j."A" AS project_id,
           array_agg(DISTINCT upper(trim(tt.name))::"ProjectNature") AS arr
    FROM "_ProjectQualTags" j
    JOIN "TagTranslation" tt ON tt."tagId" = j."B" AND tt.locale = 'en'
    WHERE upper(trim(tt.name)) IN ('SCHOOL','PERSONAL','WEB','SIMULATIONS','DATE','RANDOM')
    GROUP BY j."A"
) sub
WHERE p.id = sub.project_id;

-- 5. FKs on the new join tables (data is valid, so this validates cleanly) ----
ALTER TABLE "_ProjectSkills" ADD CONSTRAINT "_ProjectSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProjectSkills" ADD CONSTRAINT "_ProjectSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CompanySkills" ADD CONSTRAINT "_CompanySkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CompanySkills" ADD CONSTRAINT "_CompanySkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MissionSkills" ADD CONSTRAINT "_MissionSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MissionSkills" ADD CONSTRAINT "_MissionSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Drop the old tag tables / enum (data already migrated above) -------------
ALTER TABLE "TagTranslation" DROP CONSTRAINT "TagTranslation_tagId_fkey";
ALTER TABLE "_CompanyTags" DROP CONSTRAINT "_CompanyTags_A_fkey";
ALTER TABLE "_CompanyTags" DROP CONSTRAINT "_CompanyTags_B_fkey";
ALTER TABLE "_MissionTechTags" DROP CONSTRAINT "_MissionTechTags_A_fkey";
ALTER TABLE "_MissionTechTags" DROP CONSTRAINT "_MissionTechTags_B_fkey";
ALTER TABLE "_ProjectQualTags" DROP CONSTRAINT "_ProjectQualTags_A_fkey";
ALTER TABLE "_ProjectQualTags" DROP CONSTRAINT "_ProjectQualTags_B_fkey";
ALTER TABLE "_ProjectTechTags" DROP CONSTRAINT "_ProjectTechTags_A_fkey";
ALTER TABLE "_ProjectTechTags" DROP CONSTRAINT "_ProjectTechTags_B_fkey";
ALTER TABLE "_SkillTags" DROP CONSTRAINT "_SkillTags_A_fkey";
ALTER TABLE "_SkillTags" DROP CONSTRAINT "_SkillTags_B_fkey";

DROP TABLE "_CompanyTags";
DROP TABLE "_MissionTechTags";
DROP TABLE "_ProjectQualTags";
DROP TABLE "_ProjectTechTags";
DROP TABLE "_SkillTags";
DROP TABLE "TagTranslation";
DROP TABLE "Tag";
DROP TYPE "TagType";
