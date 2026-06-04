-- DropForeignKey
ALTER TABLE "ContactTranslation" DROP CONSTRAINT "ContactTranslation_contactId_fkey";

-- DropForeignKey
ALTER TABLE "ExperienceTranslation" DROP CONSTRAINT "ExperienceTranslation_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTranslation" DROP CONSTRAINT "ProjectTranslation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ResumeTranslation" DROP CONSTRAINT "ResumeTranslation_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "SkillCategoryTranslation" DROP CONSTRAINT "SkillCategoryTranslation_skillCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "SkillTranslation" DROP CONSTRAINT "SkillTranslation_skillId_fkey";

-- DropForeignKey
ALTER TABLE "TagTranslation" DROP CONSTRAINT "TagTranslation_tagId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagTranslation" ADD CONSTRAINT "TagTranslation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTranslation" ADD CONSTRAINT "SkillTranslation_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCategoryTranslation" ADD CONSTRAINT "SkillCategoryTranslation_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "SkillCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTranslation" ADD CONSTRAINT "ExperienceTranslation_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactTranslation" ADD CONSTRAINT "ContactTranslation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTranslation" ADD CONSTRAINT "ResumeTranslation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
