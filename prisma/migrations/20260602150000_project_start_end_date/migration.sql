-- Migrate Project from a single `date` to `startDate` + optional `endDate`.
-- `endDate` is nullable: NULL means the project is ongoing.

-- 1. Add the new columns. `startDate` is added nullable first so existing rows
--    can be backfilled before the NOT NULL constraint is enforced.
ALTER TABLE "Project" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "endDate" TIMESTAMP(3);

-- 2. Backfill `startDate` from the legacy `date` column (data migration step,
--    must run before `date` is dropped so no data is lost).
UPDATE "Project" SET "startDate" = "date";

-- 3. Now that every row has a value, enforce NOT NULL on `startDate`.
ALTER TABLE "Project" ALTER COLUMN "startDate" SET NOT NULL;

-- 4. Drop the legacy `date` column.
ALTER TABLE "Project" DROP COLUMN "date";
