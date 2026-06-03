-- Add the editable portrait URL to the profile (locale-independent).
-- Nullable: existing rows get NULL (no portrait set yet).
ALTER TABLE "Profile" ADD COLUMN "imageUrl" TEXT;
