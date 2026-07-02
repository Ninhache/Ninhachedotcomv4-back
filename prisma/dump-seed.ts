/**
 * Snapshots the CURRENT database into prisma/snapshot.json — the counterpart to
 * the JSON-from-frontend `seed.ts`. Replay it with `seed-from-snapshot.ts`.
 *
 * Reads tables directly via Prisma, so values are captured RAW: alias `@@key`
 * tokens and literal `<projects>…</projects>` markers are stored verbatim and
 * NEVER alias-resolved (that would freeze today's computed values). Real IDs are
 * preserved so relations restore exactly and replay is idempotent (upsert by id).
 *
 * `User` rows are intentionally excluded (no seeded admin — bootstrap via
 * POST /auth/register). Physical upload files under uploads/ are NOT captured
 * here — only the DB rows that reference them.
 *
 * Run:  npx ts-node prisma/dump-seed.ts   (yarn db:dump)
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

async function main() {
    const skillCategories = await prisma.skillCategory.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const skills = await prisma.skill.findMany({
        include: {
            translations: true,
            categoryLinks: { select: { categoryId: true, order: true } },
        },
        orderBy: { id: 'asc' },
    });
    // Blog: article categories (managed taxonomy) + articles (Markdown bodies).
    const articleCategories = await prisma.articleCategory.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const articles = await prisma.article.findMany({
        include: {
            translations: true,
            categoryLinks: { select: { categoryId: true, order: true } },
        },
        orderBy: { id: 'asc' },
    });
    const projects = await prisma.project.findMany({
        include: {
            translations: true,
            // Tech stack = skills (the unified tech entity; formerly TECH tags).
            skills: { select: { id: true } },
        },
        orderBy: { id: 'asc' },
    });
    const media = await prisma.media.findMany({ orderBy: { id: 'asc' } });
    // Timeline: companies (employers + clients), missions, positions.
    const companies = await prisma.company.findMany({
        include: {
            translations: true,
            skills: { select: { id: true } },
        },
        orderBy: { id: 'asc' },
    });
    const missions = await prisma.mission.findMany({
        include: {
            translations: true,
            skills: { select: { id: true } },
        },
        orderBy: { id: 'asc' },
    });
    const positions = await prisma.position.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const educations = await prisma.education.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const contacts = await prisma.contact.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const profiles = await prisma.profile.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const resumes = await prisma.resume.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const aliases = await prisma.alias.findMany({
        include: { bodies: true },
        orderBy: { key: 'asc' },
    });

    const snapshot = {
        _meta: {
            note: 'DB snapshot — raw values, alias @@ tokens are NOT resolved. Replay with seed-from-snapshot.ts.',
            users: 'excluded (bootstrap admin via POST /auth/register)',
        },
        skillCategories: skillCategories.map(c => ({
            id: c.id,
            isVisible: c.isVisible,
            order: c.order,
            translations: c.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                name: tr.name,
            })),
        })),
        skills: skills.map(s => ({
            id: s.id,
            image: s.image,
            wikiUrl: s.wikiUrl,
            isVisible: s.isVisible,
            categoryLinks: s.categoryLinks.map(l => ({
                categoryId: l.categoryId,
                order: l.order,
            })),
            translations: s.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                name: tr.name,
            })),
        })),
        articleCategories: articleCategories.map(c => ({
            id: c.id,
            slug: c.slug,
            isVisible: c.isVisible,
            order: c.order,
            translations: c.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                name: tr.name,
            })),
        })),
        articles: articles.map(a => ({
            id: a.id,
            slug: a.slug,
            isVisible: a.isVisible,
            publishedAt: iso(a.publishedAt),
            coverImageUrl: a.coverImageUrl,
            tags: a.tags,
            order: a.order,
            categoryLinks: a.categoryLinks.map(l => ({
                categoryId: l.categoryId,
                order: l.order,
            })),
            translations: a.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                title: tr.title,
                excerpt: tr.excerpt,
                body: tr.body,
            })),
        })),
        projects: projects.map(p => ({
            id: p.id,
            startDate: p.startDate.toISOString(),
            endDate: iso(p.endDate),
            isVisible: p.isVisible,
            gitUrl: p.gitUrl,
            visitUrl: p.visitUrl,
            playUrl: p.playUrl,
            logoUrl: p.logoUrl,
            // Optional blog cross-links (category + flagship article).
            blogCategoryId: p.blogCategoryId,
            blogArticleId: p.blogArticleId,
            // Tech stack + project nature (formerly TECH/QUAL tags).
            skillIds: p.skills.map(x => x.id),
            natures: p.natures,
            translations: p.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                name: tr.name,
                description: tr.description,
                type: tr.type,
            })),
        })),
        media: media.map(m => ({
            id: m.id,
            mediaUrl: m.mediaUrl,
            type: m.type,
            originalName: m.originalName,
            mimeType: m.mimeType,
            alt: m.alt,
            order: m.order,
            projectId: m.projectId,
        })),
        companies: companies.map(c => ({
            id: c.id,
            kind: c.kind,
            name: c.name,
            localisation: c.localisation,
            siteUrl: c.siteUrl,
            backgroundUrl: c.backgroundUrl,
            logoUrl: c.logoUrl,
            isVisible: c.isVisible,
            order: c.order,
            contractType: c.contractType,
            employmentStart: iso(c.employmentStart),
            employmentEnd: iso(c.employmentEnd),
            // CLIENT-only: the employer this client was engaged through.
            parentEmployerId: c.parentEmployerId,
            // EMPLOYER-level curated card skills.
            skillIds: c.skills.map(x => x.id),
            translations: c.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                description: tr.description,
            })),
        })),
        missions: missions.map(m => ({
            id: m.id,
            employerCompanyId: m.employerCompanyId,
            clientCompanyId: m.clientCompanyId,
            startDate: m.startDate.toISOString(),
            endDate: iso(m.endDate),
            isVisible: m.isVisible,
            order: m.order,
            imageUrl: m.imageUrl,
            skillIds: m.skills.map(x => x.id),
            translations: m.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                title: tr.title,
                context: tr.context,
                tasks: tr.tasks,
            })),
        })),
        positions: positions.map(p => ({
            id: p.id,
            companyId: p.companyId,
            startDate: p.startDate.toISOString(),
            endDate: iso(p.endDate),
            isVisible: p.isVisible,
            order: p.order,
            translations: p.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                title: tr.title,
            })),
        })),
        educations: educations.map(e => ({
            id: e.id,
            institutionName: e.institutionName,
            startDate: e.startDate.toISOString(),
            endDate: iso(e.endDate),
            logoUrl: e.logoUrl,
            siteUrl: e.siteUrl,
            isVisible: e.isVisible,
            order: e.order,
            translations: e.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                degree: tr.degree,
                description: tr.description,
            })),
        })),
        contacts: contacts.map(c => ({
            id: c.id,
            contactUrl: c.contactUrl,
            imageUrl: c.imageUrl,
            isVisible: c.isVisible,
            cssSize: c.cssSize,
            translations: c.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                name: tr.name,
            })),
        })),
        profiles: profiles.map(p => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            translations: p.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                greeting: tr.greeting,
                profession: tr.profession,
                description: tr.description,
                skillsTitle: tr.skillsTitle,
                introduction: tr.introduction,
            })),
        })),
        resumes: resumes.map(r => ({
            id: r.id,
            translations: r.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                url: tr.url,
            })),
        })),
        aliases: aliases.map(a => ({
            id: a.id,
            key: a.key,
            bodies: a.bodies.map(b => ({
                id: b.id,
                locale: b.locale,
                code: b.code,
            })),
        })),
    };

    const out = join(__dirname, 'snapshot.json');
    writeFileSync(out, JSON.stringify(snapshot, null, 2) + '\n');

    const counts = Object.entries(snapshot)
        .filter(([k]) => k !== '_meta')
        .map(([k, v]) => `${(v as unknown[]).length} ${k}`)
        .join(', ');
    console.log(`✅ Snapshot written to ${out}`);
    console.log(`   ${counts}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
