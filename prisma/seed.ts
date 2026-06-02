import { PrismaClient, TagType, ContractType, Locale, MediaType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const FRONTEND_PATH = path.resolve(__dirname, '../../Ninhachedotcomv4-seo');

function readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

interface JsonTag {
    name: string;
    url: string;
}

interface JsonProjectTranslation {
    type: string;
    description: string;
}

interface JsonProject {
    title: string;
    date: string;
    translations: Record<string, JsonProjectTranslation>;
    tags: JsonTag[];
    links: { redirect: string; git: string; play: string };
    videoUrl: string;
    image: string;
    logo: string;
    sortCategories: string[];
}

interface JsonExperienceTranslation {
    type: string;
    jobtitle: string;
    description: string;
}

interface JsonExperience {
    order: number;
    title: string;
    date: string;
    translations: Record<string, JsonExperienceTranslation>;
    tags: JsonTag[];
    link: string;
    image: string;
}

interface JsonSkill {
    name: string;
    logo: string;
    link: string;
}

interface JsonSkillCategory {
    translations: Record<string, { name: string }>;
    skills: JsonSkill[];
}

function parseExperienceDate(dateStr: string): { startDate: Date; endDate: Date } {
    // Handle formats like "September 2024 - September 2025"
    // and "June 2022 - August 2022<br>April 2023 - July 2023"
    const cleaned = dateStr.replace(/<br>/gi, ' - ');
    const parts = cleaned.split(' - ').map(s => s.trim()).filter(Boolean);

    const parseMonthYear = (s: string): Date => {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d;
        // fallback
        return new Date();
    };

    const startDate = parseMonthYear(parts[0]);
    const endDate = parseMonthYear(parts[parts.length - 1]);

    return { startDate, endDate };
}

function parseProjectDate(dateStr: string): Date {
    // Format: "MM/YYYY"
    const [month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
}

function mapContractType(typeStr: string): ContractType {
    const map: Record<string, ContractType> = {
        'Alternance': ContractType.Workstudy,
        'Apprenticeship': ContractType.Workstudy,
        'CDI': ContractType.Permanent,
        'Permanent contract': ContractType.Permanent,
        'Stage': ContractType.Internship,
        'Internship': ContractType.Internship,
        'Fixed': ContractType.Fixed,
        'Freelance': ContractType.Freelance,
    };
    return map[typeStr] ?? ContractType.Fixed;
}

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.projectTranslation.deleteMany();
    await prisma.experienceTranslation.deleteMany();
    await prisma.skillTranslation.deleteMany();
    await prisma.skillCategoryTranslation.deleteMany();
    await prisma.contactTranslation.deleteMany();
    await prisma.profileTranslation.deleteMany();
    await prisma.media.deleteMany();
    await prisma.project.deleteMany();
    await prisma.experience.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.skillCategory.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.tag.deleteMany();

    const projects = readJson<JsonProject[]>(path.join(FRONTEND_PATH, 'jsons/projects.json'));
    const experiences = readJson<JsonExperience[]>(path.join(FRONTEND_PATH, 'jsons/experiences.json'));
    const skillCategories = readJson<JsonSkillCategory[]>(path.join(FRONTEND_PATH, 'jsons/skills.json'));

    // ── 1. Tags ────────────────────────────────────────────────────────────────

    // Collect unique tech tag names from projects + experiences
    const techTagNames = new Set<string>();
    for (const p of projects) p.tags.forEach(t => techTagNames.add(t.name));
    for (const e of experiences) e.tags.forEach(t => techTagNames.add(t.name));

    // QUAL tags for sortCategories
    const qualTagNames = ['school', 'personal', 'web', 'simulations'];

    const techTagMap = new Map<string, string>(); // name → id
    for (const name of techTagNames) {
        const tag = await prisma.tag.create({
            data: {
                type: TagType.TECH,
                isVisible: true,
                hexColor: '#888888',
                translations: {
                    create: [
                        { locale: Locale.fr, name },
                        { locale: Locale.en, name },
                    ],
                },
            },
        });
        techTagMap.set(name, tag.id);
    }

    const qualTagMap = new Map<string, string>(); // name → id
    for (const name of qualTagNames) {
        const tag = await prisma.tag.create({
            data: {
                type: TagType.QUAL,
                isVisible: true,
                hexColor: '#4A90D9',
                translations: {
                    create: [
                        { locale: Locale.fr, name },
                        { locale: Locale.en, name },
                    ],
                },
            },
        });
        qualTagMap.set(name, tag.id);
    }

    console.log(`✅ Created ${techTagMap.size} tech tags, ${qualTagMap.size} qual tags`);

    // ── 2. Skill Categories + Skills ───────────────────────────────────────────

    for (const cat of skillCategories) {
        const category = await prisma.skillCategory.create({
            data: {
                isVisible: true,
                translations: {
                    create: [
                        { locale: Locale.fr, name: cat.translations.fr.name },
                        { locale: Locale.en, name: cat.translations.en.name },
                    ],
                },
            },
        });

        for (const skill of cat.skills) {
            await prisma.skill.create({
                data: {
                    image: skill.logo,
                    wikiUrl: skill.link,
                    isVisible: true,
                    categories: { connect: [{ id: category.id }] },
                    translations: {
                        create: [
                            { locale: Locale.fr, name: skill.name },
                            { locale: Locale.en, name: skill.name },
                        ],
                    },
                },
            });
        }
    }

    console.log(`✅ Created ${skillCategories.length} skill categories`);

    // ── 3. Projects ─────────────────────────────────────────────────────────────

    for (const p of projects) {
        const techTagIds = p.tags
            .map(t => techTagMap.get(t.name))
            .filter((id): id is string => Boolean(id));

        const qualTagIds = p.sortCategories
            .map(cat => qualTagMap.get(cat.toLowerCase()))
            .filter((id): id is string => Boolean(id));

        const mediaToCreate: { mediaUrl: string; type: MediaType }[] = [];
        if (p.image && p.image !== 'none') {
            mediaToCreate.push({ mediaUrl: p.image, type: MediaType.IMAGE });
        }
        if (p.videoUrl && p.videoUrl !== 'none') {
            mediaToCreate.push({ mediaUrl: p.videoUrl, type: MediaType.VIDEO });
        }

        await prisma.project.create({
            data: {
                startDate: parseProjectDate(p.date),
                endDate: null,
                isVisible: true,
                gitUrl: p.links.git !== 'none' ? p.links.git : null,
                visitUrl: p.links.redirect !== 'none' ? p.links.redirect : null,
                playUrl: p.links.play !== 'none' ? p.links.play : null,
                logoUrl: p.logo || null,

                techTags: { connect: techTagIds.map(id => ({ id })) },
                qualTags: { connect: qualTagIds.map(id => ({ id })) },

                media: mediaToCreate.length
                    ? { create: mediaToCreate }
                    : undefined,

                translations: {
                    create: (Object.entries(p.translations) as [string, JsonProjectTranslation][]).map(
                        ([locale, t]) => ({
                            locale: locale as Locale,
                            name: p.title,
                            description: t.description,
                            type: t.type,
                        })
                    ),
                },
            },
        });
    }

    console.log(`✅ Created ${projects.length} projects`);

    // ── 4. Experiences ──────────────────────────────────────────────────────────

    for (const e of experiences) {
        const tagIds = e.tags
            .map(t => techTagMap.get(t.name))
            .filter((id): id is string => Boolean(id));

        const { startDate, endDate } = parseExperienceDate(e.date);

        // Determine contract type from fr translation
        const contractType = mapContractType(e.translations.fr.type);

        await prisma.experience.create({
            data: {
                companyName: e.title,
                startDate,
                endDate,
                contractType,
                localisation: 'France',
                isVisible: true,
                siteUrl: e.link !== 'none' ? e.link : null,
                imageUrl: e.image || null,
                order: e.order,

                tags: { connect: tagIds.map(id => ({ id })) },

                translations: {
                    create: (Object.entries(e.translations) as [string, JsonExperienceTranslation][]).map(
                        ([locale, t]) => ({
                            locale: locale as Locale,
                            jobTitle: t.jobtitle,
                            description: t.description,
                        })
                    ),
                },
            },
        });
    }

    console.log(`✅ Created ${experiences.length} experiences`);

    // ── 5. Contacts ─────────────────────────────────────────────────────────────

    const contactsData = [
        {
            contactUrl: 'https://www.linkedin.com/in/n%C3%A9o-almeida/',
            imageUrl: 'svg/contact/Linkedin.svg',
            cssSize: '135px',
            names: { fr: 'in/néo-almeida', en: 'in/néo-almeida' },
        },
        {
            contactUrl: 'https://github.com/ninhache',
            imageUrl: 'svg/contact/GitHub.svg',
            cssSize: '90px',
            names: { fr: 'Ninhache', en: 'Ninhache' },
        },
        {
            contactUrl: 'mailto:neo.almeida2706@gmail.com',
            imageUrl: 'svg/contact/Mail.svg',
            cssSize: '268px',
            names: { fr: 'neo.almeida2706@gmail.com', en: 'neo.almeida2706@gmail.com' },
        },
    ];

    for (const c of contactsData) {
        await prisma.contact.create({
            data: {
                contactUrl: c.contactUrl,
                imageUrl: c.imageUrl,
                cssSize: c.cssSize,
                isVisible: true,
                translations: {
                    create: [
                        { locale: Locale.fr, name: c.names.fr },
                        { locale: Locale.en, name: c.names.en },
                    ],
                },
            },
        });
    }

    console.log(`✅ Created ${contactsData.length} contacts`);

    // ── 5. Profile (hero) ───────────────────────────────────────────────────────

    await prisma.profile.create({
        data: {
            name: 'Almeida Neo.',
            translations: {
                create: [
                    {
                        locale: Locale.fr,
                        greeting: "Bonjour, je m'appelle",
                        profession: 'Je suis développeur de logiciels.',
                        description: 'Je suis un développeur français !',
                        skillsTitle: 'Quelles sont mes compétences',
                    },
                    {
                        locale: Locale.en,
                        greeting: 'Hi, my name is',
                        profession: "I'm a Software Developer.",
                        description: "I'm a French software developer !",
                        skillsTitle: 'What are my Skills',
                    },
                ],
            },
        },
    });

    console.log('✅ Created profile');
    console.log('🎉 Seed complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
