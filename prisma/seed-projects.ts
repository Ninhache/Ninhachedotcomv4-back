/**
 * Additive / idempotent seeder for the portfolio projects described in
 * ~/projects_to_complete.txt.
 *
 * - Matches projects by their (locale-independent) name: existing rows are
 *   updated in place, new ones are created. Safe to re-run.
 * - Find-or-creates the TECH tags each project needs, reusing any that already
 *   exist (matched by their French translation name) and creating the rest with
 *   the same conventions as prisma/seed.ts (#888888, visible, fr+en names).
 * - Does NOT touch any other content; it never wipes the database.
 * - Media/links are intentionally left empty where unknown — they can be added
 *   later from the back-office.
 *
 * Run with:  npx ts-node prisma/seed-projects.ts
 */
import { Locale, PrismaClient, TagType } from '@prisma/client';

const prisma = new PrismaClient();

interface ProjectSeed {
    name: string;
    startDate: string; // ISO date
    endDate?: string | null; // null/omitted = single-date / ongoing
    gitUrl?: string | null;
    visitUrl?: string | null;
    tech: string[];
    typeFr: string;
    typeEn: string;
    descriptionFr: string;
    descriptionEn: string;
}

const PERSONAL = { fr: 'Projet personnel', en: 'Personal Project' };
const SCHOOL = { fr: 'Projet scolaire', en: 'School project' };

const PROJECTS: ProjectSeed[] = [
    {
        name: 'Nin-tcha',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        gitUrl: 'https://github.com/orgs/Nin-tcha/repositories',
        tech: ['Java', 'Quarkus', 'Kafka', 'Docker'],
        typeFr: SCHOOL.fr,
        typeEn: SCHOOL.en,
        descriptionFr:
            "Jeu de gacha sur le thème de la tortue : collectionne et fais combattre tes créatures contre les autres joueurs. L'objectif est de rassembler des monstres, monter des équipes, affronter les autres et grimper au classement Elo. Projet scolaire réalisé en équipe (organisation Nin-tcha).",
        descriptionEn:
            'A turtle-themed gacha game where you collect and battle creatures against other players. The goal is to collect monsters, build teams, fight other players, and climb the Elo leaderboard. School project built as a team (Nin-tcha organisation).',
    },
    {
        name: 'ICAL-Fac',
        startDate: '2022-09-01',
        gitUrl: 'https://github.com/Ninhache/ICAL-Fac',
        tech: ['Javascript', 'Discord'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Bot Discord qui affiche ton emploi du temps universitaire. La fac ne proposait rien de pratique et l'agenda officiel était une plaie à lire — ce bot le rend enfin lisible.",
        descriptionEn:
            'A Discord bot that displays your university timetable. The faculty offered nothing practical and the official schedule was a pain to read — this bot finally makes it legible.',
    },
    {
        name: 'HaskellHorrors',
        startDate: '2022-10-01',
        endDate: '2022-12-01',
        gitUrl: 'https://github.com/Ninhache/HaskellHorrors',
        tech: ['Haskell'],
        typeFr: SCHOOL.fr,
        typeEn: SCHOOL.en,
        descriptionFr:
            "Mes TPs de Haskell de la fac, agrémentés d'exercices LeetCode et de DS. J'ai adoré Haskell : c'est ce qui m'a lancé dans la découverte des systèmes de types et de la programmation fonctionnelle, que j'ai depuis réutilisée sur d'autres projets.",
        descriptionEn:
            "My university Haskell labs, plus some LeetCode exercises and exams. I loved Haskell — it's what got me into type systems and functional programming, which I've since reused on other projects.",
    },
    {
        name: 'NeoSnake',
        startDate: '2024-05-01',
        gitUrl: 'https://github.com/Ninhache/NeoSnake',
        tech: ['Vite', 'Typescript'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Sujet technique pour l'entreprise « Pit ». On me demandait un simple Snake, que je trouvais trop fade — j'en ai fait un jeu de Snake compétitif qui demande de la maîtrise, inspiré de Trackmania et Happy Wheels, axé sur la vitesse et le skill. Les joueurs peuvent aussi créer et partager leurs propres niveaux.",
        descriptionEn:
            'Technical test for a company called "Pit". They asked for a simple snake — I found that dull, so I built a competitive snake game that requires skill to master, inspired by Trackmania and Happy Wheels, focused on speed and skills. Players can also design and share their own levels.',
    },
    {
        name: 'Star-Realms-HpCounter',
        startDate: '2024-02-01',
        gitUrl: 'https://github.com/Ninhache/Star-Realms-HpCounter',
        tech: [],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Outil compagnon pour le jeu de deckbuilding Star Realms. C'est un 1 contre 1 entre deux flottes où l'on draine les points de vie de l'adversaire — fastidieux à compter de tête, d'où cette petite application.",
        descriptionEn:
            "A companion tool for the Star Realms deckbuilding game. It's a 1v1 between two fleets where you drain your opponent's hit points — tedious to track in your head, hence this small app.",
    },
    {
        name: 'Cpu-Emulator',
        startDate: '2023-09-01',
        endDate: '2024-01-01',
        gitUrl: 'https://github.com/Ninhache/Cpu-Emulator',
        tech: ['Rust'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Émulation d'un CPU et lecture d'assembleur (une ALU plus précisément). Projet en pause et inachevé, mais très intéressant à explorer.",
        descriptionEn:
            'Emulation of a CPU and ASM parsing (an ALU specifically). Paused and unfinished, but a fascinating project to dig into.',
    },
    {
        name: 'Typescript-Horrors',
        startDate: '2024-12-01',
        gitUrl: 'https://github.com/Ninhache/typescript-horrors',
        tech: ['Typescript'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Pour une Nuit de l'Info, l'un des défis était de faire quelque chose de fonctionnel mais architecturalement… dégueulasse. J'ai donc fait une calculatrice RPN entièrement récursive et totalement type-safe : notation polonaise inverse, conversion infixe → RPN, i18n, types utilitaires maison… et quelques crashs. Approuvée par les pairs.",
        descriptionEn:
            'For a "Nuit de l\'Info" hackathon, one challenge was to build something functional but architecturally… disgusting. So I made a fully recursive, fully type-safe RPN calculator: reverse Polish notation, infix-to-RPN conversion, i18n, custom utility types… and a few crashes. Approved by peers.',
    },
    {
        name: 'NinIde',
        startDate: '2024-11-01',
        gitUrl: 'https://github.com/Ninhache/NinIde',
        tech: ['C', 'termios'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Un IDE écrit en C, inspiré de Vim, avec plusieurs modes d'édition, un Ctrl-F et quelques fonctionnalités amusantes.",
        descriptionEn:
            'An IDE written in C, inspired by Vim, with several editing modes, a Ctrl-F search and a few fun features.',
    },
    {
        name: 'NinAnimate',
        startDate: '2025-03-01',
        gitUrl: 'https://github.com/Ninhache/NinAnimate',
        tech: ['NextJS', 'Typescript', 'CSS'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Un outil pour montrer les différences d'un bout de code à un autre, pratique pour des présentations. Inspiré de vidéos vues en ligne et du « magic diff » de certains plugins.",
        descriptionEn:
            'A tool to show the diff from one piece of code to another — handy for presentations. Inspired by videos seen online and the "magic diff" found in some plugins.',
    },
    {
        name: 'Word-Processing',
        startDate: '2025-06-01',
        gitUrl: 'https://github.com/Ninhache/poc-word-processing',
        tech: ['word2vec'],
        typeFr: SCHOOL.fr,
        typeEn: SCHOOL.en,
        descriptionFr:
            "Utilisation de word2vec pour comparer des mots et traiter plus facilement des devis. Le concept a ensuite été réutilisé sur le projet « Travaux Sisters ».",
        descriptionEn:
            'Using word2vec to compare words and process quotes more easily. The concept was later reused on the "Travaux Sisters" project.',
    },
    {
        name: 'Raytracer',
        startDate: '2025-10-01',
        endDate: '2025-12-01',
        gitUrl: 'https://github.com/Ninhache/Raytracer',
        tech: ['Java', 'JavaFX'],
        typeFr: SCHOOL.fr,
        typeEn: SCHOOL.en,
        descriptionFr:
            "Un raytracer écrit en Java avec deux points d'entrée : une version CLI (console) et une version graphique en JavaFX, le tout avec des préoccupations d'optimisation.",
        descriptionEn:
            'A raytracer written in Java with two entry points: a CLI version (console only) and a GUI version based on JavaFX, with optimization concerns throughout.',
    },
    {
        name: 'Deob-mapper',
        startDate: '2026-03-01',
        endDate: '2026-04-01',
        gitUrl: null, // PRIVATE — no public repo
        tech: ['Rust'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "Associe des sources Java lisibles à leurs équivalents obfusqués par ProGuard. On dispose des .java originaux (vrais noms de classes/méthodes) et d'un dump décompilé aux noms mutilés (fBU.java, aCK.java…) — cet outil détermine lesquels correspondent. Projet privé.",
        descriptionEn:
            'Matches readable Java sources to their ProGuard-obfuscated counterparts. You have the original .java files with real class/method names and a decompiled dump with mangled names like fBU.java, aCK.java — this tool figures out which is which. Private project.',
    },
    {
        name: 'EML-Operator',
        startDate: '2026-03-01', // inferred from arXiv:2603.21852 (no explicit date given)
        gitUrl: 'https://github.com/Ninhache/EML-Operator',
        tech: ['Python', 'Torch'],
        typeFr: PERSONAL.fr,
        typeEn: PERSONAL.en,
        descriptionFr:
            "À partir de l'article arXiv:2603.21852, ce prototype met en œuvre une régression symbolique par gradient sur des arbres EML (la « master formula »), reproduisant les expériences de récupération exactes de la §4.3.",
        descriptionEn:
            'Based on arXiv:2603.21852, this prototype implements gradient-based symbolic regression over EML trees (the "master formula"), reproducing the exact recovery experiments from §4.3.',
    },
];

const tagCache = new Map<string, string>();

/** Find an existing TECH tag by its French name, or create it (fr+en). */
async function techTagId(name: string): Promise<string> {
    const cached = tagCache.get(name);
    if (cached) return cached;

    const existing = await prisma.tagTranslation.findFirst({
        where: { name, locale: Locale.fr, tag: { type: TagType.TECH } },
        select: { tagId: true },
    });
    if (existing) {
        tagCache.set(name, existing.tagId);
        return existing.tagId;
    }

    const created = await prisma.tag.create({
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
    console.log(`  + created tech tag "${name}"`);
    tagCache.set(name, created.id);
    return created.id;
}

async function upsertProject(p: ProjectSeed) {
    const techIds = await Promise.all(p.tech.map(techTagId));

    const translations = [
        {
            locale: Locale.fr,
            name: p.name,
            description: p.descriptionFr,
            type: p.typeFr,
        },
        {
            locale: Locale.en,
            name: p.name,
            description: p.descriptionEn,
            type: p.typeEn,
        },
    ];

    const existing = await prisma.projectTranslation.findFirst({
        where: { name: p.name },
        select: { projectId: true },
    });

    if (existing) {
        await prisma.project.update({
            where: { id: existing.projectId },
            data: {
                startDate: new Date(p.startDate),
                endDate: p.endDate ? new Date(p.endDate) : null,
                isVisible: true,
                gitUrl: p.gitUrl ?? null,
                visitUrl: p.visitUrl ?? null,
                techTags: { set: techIds.map(id => ({ id })) },
                translations: { deleteMany: {}, create: translations },
            },
        });
        console.log(`~ updated  ${p.name}`);
    } else {
        await prisma.project.create({
            data: {
                startDate: new Date(p.startDate),
                endDate: p.endDate ? new Date(p.endDate) : null,
                isVisible: true,
                gitUrl: p.gitUrl ?? null,
                visitUrl: p.visitUrl ?? null,
                techTags: { connect: techIds.map(id => ({ id })) },
                translations: { create: translations },
            },
        });
        console.log(`+ created  ${p.name}`);
    }
}

async function main() {
    console.log('Seeding portfolio projects (idempotent)…');
    for (const p of PROJECTS) {
        await upsertProject(p);
    }
    console.log(`✅ Done — ${PROJECTS.length} projects processed.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
