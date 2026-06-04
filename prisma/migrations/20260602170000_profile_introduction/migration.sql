-- Add the editable "Who am I?" introduction paragraph to profile translations.
-- NOT NULL DEFAULT '' (matches the sibling fields) — existing rows get an empty string.
ALTER TABLE "ProfileTranslation" ADD COLUMN "introduction" TEXT NOT NULL DEFAULT '';
