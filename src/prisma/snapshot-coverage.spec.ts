import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guard against silent snapshot drift.
 *
 * `prisma/dump-seed.ts` + `prisma/seed-from-snapshot.ts` mirror the Prisma schema
 * BY HAND (one query/upsert per model). The TypeScript compiler catches REMOVED or
 * RENAMED models (the scripts stop compiling), but it does NOT catch ADDED models —
 * a new model compiles fine and is silently omitted, so a dump→restore loses its
 * data without any error. This test closes that gap: every content model declared in
 * `schema.prisma` must be referenced (as `prisma.<model>.`) in BOTH scripts.
 *
 * When this test fails after a schema change, you have two correct fixes:
 *   1. The model SHOULD be snapshotted → add its query+mapping to dump-seed.ts and its
 *      upsert (in FK-dependency order) to seed-from-snapshot.ts.
 *   2. The model is intentionally NOT snapshotted → add it to NOT_SNAPSHOTTED below
 *      with a one-line reason. Making the exclusion explicit is the point.
 *
 * See back/CLAUDE.md → "Content snapshot workflow" for the full procedure.
 */

// Models deliberately not dumped directly. Translation tables and pure join tables
// are written through their parent's nested `translations` / `connect`, never via a
// top-level `prisma.<model>` call — so they are excluded structurally below, not here.
const NOT_SNAPSHOTTED = new Set<string>([
    'User', // excluded by design — bootstrap admin via POST /auth/register
    'SkillOnCategory', // join table, written via Skill.categoryLinks nested create
    'ArticleOnCategory', // join table, written via Article.categoryLinks nested create
    'AliasBody', // written via Alias.bodies nested create
    // CV generator config: its generated*Url fields point at physical uploads
    // PDFs that the snapshot never captures, so restoring it would dangle.
    // It is local tooling state — regenerate per environment.
    'CvConfig',
]);

const prismaDir = join(process.cwd(), 'prisma');
const read = (f: string) => readFileSync(join(prismaDir, f), 'utf8');

/** All `model X { … }` names declared in schema.prisma. */
function schemaModels(): string[] {
    const schema = read('schema.prisma');
    const names: string[] = [];
    const re = /^model\s+(\w+)\s*\{/gm;
    let m: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic regex exec loop
    while ((m = re.exec(schema)) !== null) names.push(m[1]);
    return names;
}

/** Prisma client accessor for a model name (PascalCase → camelCase). */
const accessor = (model: string) => model[0].toLowerCase() + model.slice(1);

describe('snapshot scripts cover every content model', () => {
    const models = schemaModels()
        // Translation tables are snapshotted via their parent's nested writes.
        .filter(name => !name.endsWith('Translation'))
        .filter(name => !NOT_SNAPSHOTTED.has(name));

    const dumpSrc = read('dump-seed.ts');
    const restoreSrc = read('seed-from-snapshot.ts');

    it('sanity: found a non-trivial set of models in schema.prisma', () => {
        // Guards against the regex silently matching nothing (which would make
        // every assertion below vacuously pass).
        expect(models.length).toBeGreaterThan(5);
    });

    it.each(models)('dump-seed.ts reads %s', model => {
        expect(dumpSrc).toContain(`prisma.${accessor(model)}.`);
    });

    it.each(models)('seed-from-snapshot.ts writes %s', model => {
        expect(restoreSrc).toContain(`prisma.${accessor(model)}.`);
    });
});
