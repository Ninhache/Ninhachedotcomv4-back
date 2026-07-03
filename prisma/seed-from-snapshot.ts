/**
 * Replays prisma/snapshot.json (produced by dump-seed.ts) into the database.
 *
 * Idempotent: every row is upserted by its real id, so re-running creates what's
 * missing and updates what exists — no duplicates. Relations are restored by id
 * (`connect`/`set`). Parents are written before dependents so foreign keys hold
 * (skills → projects/companies/missions; companies → missions/positions; and
 * EMPLOYER companies before the CLIENT rows that point at them via parentEmployerId).
 *
 * Upsert-only: rows present in the DB but absent from the snapshot are left
 * untouched (non-destructive). Values are written verbatim — alias `@@` tokens
 * stay raw. `User` rows are not part of the snapshot.
 *
 * Run:  npx ts-node prisma/seed-from-snapshot.ts   (yarn db:restore)
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

type Tr = Record<string, unknown> & { id: string; locale: string };
const ids = (xs: string[] = []) => xs.map(id => ({ id }));
const date = (s: string | null | undefined) => (s ? new Date(s) : null);

async function main() {
    const snapshot = JSON.parse(
        readFileSync(join(__dirname, 'snapshot.json'), 'utf8')
    );

    // 1. Skill categories (no deps) -----------------------------------------
    for (const c of snapshot.skillCategories ?? []) {
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
                order: c.order ?? 0,
                translations: { create: translations },
            },
            update: {
                isVisible: c.isVisible,
                order: c.order ?? 0,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 2. Skills (depend on categories) --------------------------------------
    for (const s of snapshot.skills ?? []) {
        const translations = s.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
        }));
        // explicit join rows carrying the per-category order
        const categoryLinks = (s.categoryLinks ?? []).map(
            (l: { categoryId: string; order: number }) => ({
                order: l.order,
                category: { connect: { id: l.categoryId } },
            })
        );
        await prisma.skill.upsert({
            where: { id: s.id },
            create: {
                id: s.id,
                image: s.image,
                wikiUrl: s.wikiUrl,
                isVisible: s.isVisible,
                categoryLinks: { create: categoryLinks },
                translations: { create: translations },
            },
            update: {
                image: s.image,
                wikiUrl: s.wikiUrl,
                isVisible: s.isVisible,
                categoryLinks: { deleteMany: {}, create: categoryLinks },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 2b. Article categories (no deps) --------------------------------------
    for (const c of snapshot.articleCategories ?? []) {
        const translations = c.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
        }));
        await prisma.articleCategory.upsert({
            where: { id: c.id },
            create: {
                id: c.id,
                slug: c.slug,
                isVisible: c.isVisible,
                order: c.order ?? 0,
                translations: { create: translations },
            },
            update: {
                slug: c.slug,
                isVisible: c.isVisible,
                order: c.order ?? 0,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 2c. Articles (depend on article categories) ---------------------------
    for (const a of snapshot.articles ?? []) {
        const translations = a.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            title: tr.title,
            excerpt: tr.excerpt,
            body: tr.body,
        }));
        // explicit join rows carrying the per-category order
        const categoryLinks = (a.categoryLinks ?? []).map(
            (l: { categoryId: string; order: number }) => ({
                order: l.order,
                category: { connect: { id: l.categoryId } },
            })
        );
        const scalars = {
            slug: a.slug,
            isVisible: a.isVisible,
            publishedAt: date(a.publishedAt),
            coverImageUrl: a.coverImageUrl ?? null,
            order: a.order ?? 0,
        };
        await prisma.article.upsert({
            where: { id: a.id },
            create: {
                id: a.id,
                ...scalars,
                tags: a.tags ?? [],
                categoryLinks: { create: categoryLinks },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                tags: { set: a.tags ?? [] },
                categoryLinks: { deleteMany: {}, create: categoryLinks },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 3. Projects (depend on skills + article categories/articles) ----------
    for (const p of snapshot.projects ?? []) {
        const translations = p.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            name: tr.name,
            description: tr.description,
            type: tr.type,
        }));
        const scalars = {
            startDate: new Date(p.startDate),
            endDate: date(p.endDate),
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
                natures: p.natures ?? [],
                ...(p.blogCategoryId
                    ? { blogCategory: { connect: { id: p.blogCategoryId } } }
                    : {}),
                ...(p.blogArticleId
                    ? { blogArticle: { connect: { id: p.blogArticleId } } }
                    : {}),
                skills: { connect: ids(p.skillIds) },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                natures: { set: p.natures ?? [] },
                blogCategory: p.blogCategoryId
                    ? { connect: { id: p.blogCategoryId } }
                    : { disconnect: true },
                blogArticle: p.blogArticleId
                    ? { connect: { id: p.blogArticleId } }
                    : { disconnect: true },
                skills: { set: ids(p.skillIds) },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 4. Media (depend on projects) -----------------------------------------
    for (const m of snapshot.media ?? []) {
        const scalars = {
            mediaUrl: m.mediaUrl,
            type: m.type,
            originalName: m.originalName,
            mimeType: m.mimeType,
            alt: m.alt,
            order: m.order ?? 0,
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

    // 5. Companies (depend on skills; self-FK parentEmployerId) --------------
    // EMPLOYER rows (parentEmployerId = null) first so CLIENT rows can connect.
    const companies = [...(snapshot.companies ?? [])].sort(
        (a, b) => (a.parentEmployerId ? 1 : 0) - (b.parentEmployerId ? 1 : 0)
    );
    for (const c of companies) {
        const translations = c.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            description: tr.description,
        }));
        const scalars = {
            kind: c.kind,
            name: c.name,
            localisation: c.localisation,
            siteUrl: c.siteUrl,
            backgroundUrl: c.backgroundUrl ?? null,
            logoUrl: c.logoUrl,
            isVisible: c.isVisible,
            order: c.order ?? 0,
            contractType: c.contractType ?? null,
            employmentStart: date(c.employmentStart),
            employmentEnd: date(c.employmentEnd),
        };
        await prisma.company.upsert({
            where: { id: c.id },
            create: {
                id: c.id,
                ...scalars,
                ...(c.parentEmployerId
                    ? { parentEmployer: { connect: { id: c.parentEmployerId } } }
                    : {}),
                skills: { connect: ids(c.skillIds) },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                parentEmployer: c.parentEmployerId
                    ? { connect: { id: c.parentEmployerId } }
                    : { disconnect: true },
                skills: { set: ids(c.skillIds) },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 6. Missions (depend on companies + skills) ----------------------------
    for (const m of snapshot.missions ?? []) {
        const translations = m.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            title: tr.title,
            context: tr.context,
            tasks: (tr.tasks as string[]) ?? [],
        }));
        const scalars = {
            startDate: new Date(m.startDate),
            endDate: date(m.endDate),
            isVisible: m.isVisible,
            order: m.order ?? 0,
            imageUrl: m.imageUrl,
        };
        await prisma.mission.upsert({
            where: { id: m.id },
            create: {
                id: m.id,
                ...scalars,
                employerCompany: { connect: { id: m.employerCompanyId } },
                ...(m.clientCompanyId
                    ? { clientCompany: { connect: { id: m.clientCompanyId } } }
                    : {}),
                skills: { connect: ids(m.skillIds) },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                employerCompany: { connect: { id: m.employerCompanyId } },
                clientCompany: m.clientCompanyId
                    ? { connect: { id: m.clientCompanyId } }
                    : { disconnect: true },
                skills: { set: ids(m.skillIds) },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 7. Positions (depend on companies) ------------------------------------
    for (const p of snapshot.positions ?? []) {
        const translations = p.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            title: tr.title,
        }));
        const scalars = {
            startDate: new Date(p.startDate),
            endDate: date(p.endDate),
            isVisible: p.isVisible,
            order: p.order ?? 0,
        };
        await prisma.position.upsert({
            where: { id: p.id },
            create: {
                id: p.id,
                ...scalars,
                company: { connect: { id: p.companyId } },
                translations: { create: translations },
            },
            update: {
                ...scalars,
                company: { connect: { id: p.companyId } },
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 8. Education (no deps) -------------------------------------------------
    for (const e of snapshot.educations ?? []) {
        const translations = e.translations.map((tr: Tr) => ({
            id: tr.id,
            locale: tr.locale,
            degree: tr.degree,
            description: tr.description ?? null,
        }));
        const scalars = {
            institutionName: e.institutionName,
            startDate: new Date(e.startDate),
            endDate: date(e.endDate),
            logoUrl: e.logoUrl,
            siteUrl: e.siteUrl,
            isVisible: e.isVisible,
            order: e.order ?? 0,
        };
        await prisma.education.upsert({
            where: { id: e.id },
            create: {
                id: e.id,
                ...scalars,
                translations: { create: translations },
            },
            update: {
                ...scalars,
                translations: { deleteMany: {}, create: translations },
            },
        });
    }

    // 9. Contacts (no deps) -------------------------------------------------
    for (const c of snapshot.contacts ?? []) {
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

    // 10. Profile (singleton-ish) -------------------------------------------
    for (const p of snapshot.profiles ?? []) {
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

    // 11. Resume ------------------------------------------------------------
    for (const r of snapshot.resumes ?? []) {
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

    // 12. Aliases (no deps) -------------------------------------------------
    for (const a of snapshot.aliases ?? []) {
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
    ]
        .map(k => `${(snapshot[k] ?? []).length} ${k}`)
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
