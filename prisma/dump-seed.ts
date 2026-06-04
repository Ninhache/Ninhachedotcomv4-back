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
 * Run:  npx ts-node prisma/dump-seed.ts
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
    const tags = await prisma.tag.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const skillCategories = await prisma.skillCategory.findMany({
        include: { translations: true },
        orderBy: { id: 'asc' },
    });
    const skills = await prisma.skill.findMany({
        include: {
            translations: true,
            tags: { select: { id: true } },
            categoryLinks: { select: { categoryId: true, order: true } },
        },
        orderBy: { id: 'asc' },
    });
    const projects = await prisma.project.findMany({
        include: {
            translations: true,
            techTags: { select: { id: true } },
            qualTags: { select: { id: true } },
        },
        orderBy: { id: 'asc' },
    });
    const media = await prisma.media.findMany({ orderBy: { id: 'asc' } });
    const experiences = await prisma.experience.findMany({
        include: { translations: true, tags: { select: { id: true } } },
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
        tags: tags.map(t => ({
            id: t.id,
            type: t.type,
            isVisible: t.isVisible,
            hexColor: t.hexColor,
            translations: t.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                name: tr.name,
            })),
        })),
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
            tagIds: s.tags.map(x => x.id),
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
        projects: projects.map(p => ({
            id: p.id,
            startDate: p.startDate.toISOString(),
            endDate: p.endDate ? p.endDate.toISOString() : null,
            isVisible: p.isVisible,
            gitUrl: p.gitUrl,
            visitUrl: p.visitUrl,
            playUrl: p.playUrl,
            logoUrl: p.logoUrl,
            techTagIds: p.techTags.map(x => x.id),
            qualTagIds: p.qualTags.map(x => x.id),
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
            projectId: m.projectId,
        })),
        experiences: experiences.map(e => ({
            id: e.id,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate.toISOString(),
            contractType: e.contractType,
            localisation: e.localisation,
            isVisible: e.isVisible,
            siteUrl: e.siteUrl,
            imageUrl: e.imageUrl,
            order: e.order,
            companyName: e.companyName,
            tagIds: e.tags.map(x => x.id),
            translations: e.translations.map(tr => ({
                id: tr.id,
                locale: tr.locale,
                jobTitle: tr.jobTitle,
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
