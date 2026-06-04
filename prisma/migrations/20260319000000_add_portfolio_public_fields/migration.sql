-- Add playUrl and logoUrl to Project
ALTER TABLE "Project" ADD COLUMN "playUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN "logoUrl" TEXT;

-- Add type to ProjectTranslation
ALTER TABLE "ProjectTranslation" ADD COLUMN "type" TEXT;

-- Add imageUrl and order to Experience
ALTER TABLE "Experience" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Experience" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add cssSize to Contact
ALTER TABLE "Contact" ADD COLUMN "cssSize" TEXT;
