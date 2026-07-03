-- CreateEnum
CREATE TYPE "CompanyKind" AS ENUM ('EMPLOYER', 'CLIENT');

-- AlterEnum
ALTER TYPE "TagType" ADD VALUE 'MISSION_TECH';

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "kind" "CompanyKind" NOT NULL,
    "name" TEXT NOT NULL,
    "localisation" TEXT,
    "siteUrl" TEXT,
    "logoUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "contractType" "ContractType",
    "employmentStart" TIMESTAMP(3),
    "employmentEnd" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "employerCompanyId" TEXT NOT NULL,
    "clientCompanyId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "tasks" TEXT[],
    "missionId" TEXT NOT NULL,

    CONSTRAINT "MissionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "logoUrl" TEXT,
    "siteUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationTranslation" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "degree" TEXT NOT NULL,
    "description" TEXT,
    "educationId" TEXT NOT NULL,

    CONSTRAINT "EducationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MissionTechTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MissionTechTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissionTranslation_missionId_locale_key" ON "MissionTranslation"("missionId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "EducationTranslation_educationId_locale_key" ON "EducationTranslation"("educationId", "locale");

-- CreateIndex
CREATE INDEX "_MissionTechTags_B_index" ON "_MissionTechTags"("B");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_employerCompanyId_fkey" FOREIGN KEY ("employerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTranslation" ADD CONSTRAINT "MissionTranslation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationTranslation" ADD CONSTRAINT "EducationTranslation_educationId_fkey" FOREIGN KEY ("educationId") REFERENCES "Education"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionTechTags" ADD CONSTRAINT "_MissionTechTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionTechTags" ADD CONSTRAINT "_MissionTechTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
