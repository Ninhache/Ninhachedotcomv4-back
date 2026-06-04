/**
 * Replays prisma/snapshot.json (produced by dump-seed.ts) into the database.
 *
 * Idempotent: every row is upserted by its real id, so re-running creates what's
 * missing and updates what exists — no duplicates. Relations are restored by id
 * (`connect`/`set`). Parents are written before dependents so foreign keys hold.
 *
 * Upsert-only: rows present in the DB but absent from the snapshot are left
 * untouched (non-destructive). Values are written verbatim — alias `@@` tokens
 * stay raw. `User` rows are not part of the snapshot.
 *
 * Run:  npx ts-node prisma/seed-from-snapshot.ts
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

type Tr = Record<string, unknown> & { id: string; locale: string };
const ids = (xs: string[]) => xs.map(id => ({ id }));

async function main() {
    const snapshot = JSON.parse(
        readFileSync(join(__dirname, 'snapshot.json'), 'utf8')
    );

    // 1. Tags (no deps) ------------------------------------------------------
    for (const t of snapshot.tags) {
        const translations = t.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
        }));
        await prisma.tag.upsert({
            where: { id: t.id },
            create: {
                id: t.id,
                type: t.type,
                isVisible: t.isVisible,
                hexColor: t.hexColor,
                translations: { create: translations },
            },
            update: {
                type: t.type,
                isVisible: t.isVisible,
                hexColor: t.hexColor,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 2. Skill categories (no deps) -----------------------------------------
    for (const c of snapshot.skillCategories) {
        const translations = c.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
        }));
        await prisma.skillCategory.upsert({
            where: { id: c.id },
            create: {
                id: c.id,
                isVisible: c.isVisible,
                translations: { create: translations },
            },
            update: {
                isVisible: c.isVisible,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 3. Skills (depend on tags + categories) -------------------------------
    for (const s of snapshot.skills) {
        const translations = s.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
        }));
        await prisma.skill.upsert({
            where: { id: s.id },
            create: {
                id: s.id,
                image: s.image,
                wikiUrl: s.wikiUrl,
                isVisible: s.isVisible,
                tags: { connect: ids(s.tagIds) },
                categories: { connect: ids(s.categoryIds) },
                translations: { create: translations },
            },
            update: {
                image: s.image,
                wikiUrl: s.wikiUrl,
                isVisible: s.isVisible,
                tags: { set: ids(s.tagIds) },
                categories: { set: ids(s.categoryIds) },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 4. Projects (depend on tags) ------------------------------------------
    for (const p of snapshot.projects) {
        const translations = p.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
            description: tr.description,
            type: tr.type,
        }));
        const scalars = {
            startDate: new Date(p.startDate),
            endDate: p.endDate ? new Date(p.endDate) : null,
            isVisible: p.isVisible,
            gitUrl: p.gitUrl,
            visitUrl: p.visitUrl,
            playUrl: p.playUrl,
            logoUrl: p.logoUrl,
        };
        await prisma.project.upsert({
            where: { id: p.id },
            create: {
                id: p.id,
                ...scalars,
                techTags: { connect: ids(p.techTagIds) },
                qualTags: { connect: ids(p.qualTagIds) },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                techTags: { set: ids(p.techTagIds) },
                qualTags: { set: ids(p.qualTagIds) },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 5. Media (depend on projects) -----------------------------------------
    for (const m of snapshot.media) {
        const scalars = {
            mediaUrl: m.mediaUrl,
            type: m.type,
            originalName: m.originalName,
            mimeType: m.mimeType,
            alt: m.alt,
        };
        await prisma.media.upsert({
            where: { id: m.id },
            create: {
                id: m.id,
                ...scalars,
                ...(m.projectId
                    ? { project: { connect: { id: m.projectId } } }
                    : {}),
            },
            update: {
                ...scalars,
                project: m.projectId
                    ? { connect: { id: m.projectId } }
                    : { disconnect: true },
            },
        });
    }

    // 6. Experiences (depend on tags) ---------------------------------------
    for (const e of snapshot.experiences) {
        const translations = e.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            jobTitle: tr.jobTitle,
            description: tr.description,
        }));
        const scalars = {
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
            contractType: e.contractType,
            localisation: e.localisation,
            isVisible: e.isVisible,
            siteUrl: e.siteUrl,
            imageUrl: e.imageUrl,
            order: e.order,
            companyName: e.companyName,
        };
        await prisma.experience.upsert({
            where: { id: e.id },
            create: {
                id: e.id,
                ...scalars,
                tags: { connect: ids(e.tagIds) },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                tags: { set: ids(e.tagIds) },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 7. Contacts (no deps) -------------------------------------------------
    for (const c of snapshot.contacts) {
        const translations = c.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
        }));
        await prisma.contact.upsert({
            where: { id: c.id },
            create: {
                id: c.id,
                contactUrl: c.contactUrl,
                imageUrl: c.imageUrl,
                isVisible: c.isVisible,
                cssSize: c.cssSize,
                translations: { create: translations },
            },
            update: {
                contactUrl: c.contactUrl,
                imageUrl: c.imageUrl,
                isVisible: c.isVisible,
                cssSize: c.cssSize,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 8. Profile (singleton-ish) --------------------------------------------
    for (const p of snapshot.profiles) {
        const translations = p.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            greeting: tr.greeting,
            profession: tr.profession,
            description: tr.description,
            skillsTitle: tr.skillsTitle,
            introduction: tr.introduction,
        }));
        await prisma.profile.upsert({
            where: { id: p.id },
            create: {
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                translations: { create: translations },
            },
            update: {
                name: p.name,
                imageUrl: p.imageUrl,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 9. Resume -------------------------------------------------------------
    for (const r of snapshot.resumes) {
        const translations = r.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            url: tr.url,
        }));
        await prisma.resume.upsert({
            where: { id: r.id },
            create: { id: r.id, translations: { create: translations } },
            update: { translations: { deleteMany: {}, create: translations } },
        });
    }

    // 10. Aliases (no deps) -------------------------------------------------
    for (const a of snapshot.aliases) {
        const bodies = a.bodies.map((b: Tr & { code: string }) => ({
            id: b.id,
            locale: b.locale,
            code: b.code,
        }));
        await prisma.alias.upsert({
            where: { id: a.id },
            create: { id: a.id, key: a.key, bodies: { create: bodies } },
            update: { key: a.key, bodies: { deleteMany: {}, create: bodies } },
        });
    }

    const total = [
        'tags',
        'skillCategories',
        'skills',
        'projects',
        'media',
        'experiences',
        'contacts',
        'profiles',
        'resumes',
        'aliases',
    ]
        .map(k => `${snapshot[k].length} ${k}`)
        .join(', ');
    console.log(`✅ Restored from snapshot: ${total}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
