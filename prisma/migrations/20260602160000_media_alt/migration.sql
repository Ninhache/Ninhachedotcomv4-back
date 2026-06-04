-- Add an editable, nullable `alt` (alt text) field to Media.
-- Nullable: existing media rows get NULL (no alt text set yet).
ALTER TABLE "Media" ADD COLUMN "alt" TEXT;
