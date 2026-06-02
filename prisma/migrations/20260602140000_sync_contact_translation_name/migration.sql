-- Reconciliation migration.
--
-- `20250607002203_add_global_i18n` created "ContactTranslation"."text", but the
-- schema (and live DBs) use "name"; the rename was never captured as a
-- migration, causing persistent drift. This guarded rename makes a fresh replay
-- end up with "name" (matching the schema) while being a safe no-op on any DB
-- that already has "name". No data is lost (a RENAME preserves values).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ContactTranslation' AND column_name = 'text'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ContactTranslation' AND column_name = 'name'
    ) THEN
        ALTER TABLE "ContactTranslation" RENAME COLUMN "text" TO "name";
    END IF;
END $$;
