/**
 * MEP vehicle: replaces the live content with prisma/snapshot.json, wholesale.
 *
 * Why this exists on top of `db:restore`: seed-from-snapshot.ts is upsert-only,
 * so it can add and update but never delete. Replaying it on a live database
 * leaves behind every row that was deleted locally since the last promotion
 * (an unpublished article, a removed mission, a dropped skill). This script
 * closes that gap by emptying the content tables first, so what ships is
 * exactly the snapshot and nothing else.
 *
 * Deliberately preserved (never truncated):
 *   - `User`      — the admin account is per-environment, bootstrapped via
 *                   POST /auth/register, and is not in the snapshot.
 *   - `CvConfig`  — local tooling state whose generated*Url fields point at
 *                   physical uploads/ PDFs the snapshot never captures.
 *   - `_prisma_migrations` — schema history; owned by `prisma migrate deploy`.
 *
 * The truncate list is derived from the live database, not hardcoded, so a new
 * model can never be silently skipped. Physical files under uploads/ are out of
 * scope here (rsync them separately; the snapshot only carries the rows that
 * reference them).
 *
 * Run:  yarn db:promote --yes
 *
 * Order on the live host:
 *   1. pg_dump  (this step is destructive and has no undo)
 *   2. scp prisma/snapshot.json  (it is gitignored, it does not travel by git)
 *   3. npx prisma migrate deploy
 *   4. yarn db:promote --yes
 */
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { restoreFromSnapshot } from './seed-from-snapshot';

const prisma = new PrismaClient();

/** Tables whose contents are environment-owned, not snapshot-owned. */
const PRESERVED = ['User', 'CvConfig', '_prisma_migrations'];

/** Snapshot keys that carry content rows, used only for the pre-run summary. */
const CONTENT_KEYS = [
    'skillCategories',
    'skills',
    'articleCategories',
    'articles',
    'projects',
    'media',
    'companies',
    'missions',
    'positions',
    'educations',
    'contacts',
    'profiles',
    'resumes',
    'aliases',
];

/**
 * Fails fast when the schema is behind the snapshot.
 *
 * Truncate-then-restore is not atomic across the two phases, so a restore that
 * dies on a missing column would leave the site empty. Cheaper to refuse here.
 */
async function assertMigrationsApplied() {
    const onDisk = readdirSync(join(__dirname, 'migrations'), {
        withFileTypes: true,
    })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const applied = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
        'select migration_name from "_prisma_migrations" where finished_at is not null and rolled_back_at is null'
    );
    const appliedNames = new Set(applied.map(r => r.migration_name));
    const pending = onDisk.filter(name => !appliedNames.has(name));

    if (pending.length > 0) {
        throw new Error(
            `${pending.length} migration(s) not applied on this database:\n` +
                pending.map(n => `  - ${n}`).join('\n') +
                '\nRun `npx prisma migrate deploy` first.'
        );
    }
}

/** Every public table except the environment-owned ones. */
async function contentTables(): Promise<string[]> {
    const rows = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
        "select tablename from pg_tables where schemaname = 'public' order by tablename"
    );
    return rows.map(r => r.tablename).filter(t => !PRESERVED.includes(t));
}

async function main() {
    const confirmed = process.argv.includes('--yes');

    const snapshot = JSON.parse(
        readFileSync(join(__dirname, 'snapshot.json'), 'utf8')
    );
    const summary = CONTENT_KEYS.map(
        k => `${(snapshot[k] ?? []).length} ${k}`
    ).join(', ');

    await assertMigrationsApplied();

    const tables = await contentTables();
    const users = await prisma.user.count();

    console.log(`Snapshot: ${summary}`);
    console.log(
        `Truncate: ${tables.length} table(s), preserving ${PRESERVED.join(', ')} (${users} user row(s) kept)`
    );

    if (!confirmed) {
        console.log(
            '\nDry run. This wipes every content table before replaying the snapshot.\n' +
                'Take a pg_dump first, then re-run with --yes.'
        );
        return;
    }

    // One statement: CASCADE lets Postgres ignore FK order, RESTART IDENTITY
    // resets the few sequences so a re-promotion is byte-identical.
    const quoted = tables.map(t => `"${t}"`).join(', ');
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`
    );
    console.log(`🗑️  Truncated ${tables.length} table(s)`);

    await restoreFromSnapshot();

    const kept = await prisma.user.count();
    console.log(`👤 ${kept} user row(s) preserved`);
}

main()
    .catch(e => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
