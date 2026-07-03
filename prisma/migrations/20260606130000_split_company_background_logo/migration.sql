-- Split Company media into a background (« fond ») and a logo.
-- The existing `logoUrl` column actually held large illustration images, so we
-- RENAME it to `backgroundUrl` (preserving all existing data → they become the
-- public site's backgrounds) and add a fresh, empty `logoUrl` for the real
-- company logos consumed by the standalone timeline app.
ALTER TABLE "Company" RENAME COLUMN "logoUrl" TO "backgroundUrl";
ALTER TABLE "Company" ADD COLUMN "logoUrl" TEXT;
