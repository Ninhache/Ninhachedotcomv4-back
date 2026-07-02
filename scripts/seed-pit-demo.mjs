// One-shot demo data: employer "Pit" + 3 client missions, via the admin API.
// Run: node scripts/seed-pit-demo.mjs
const BASE = 'http://localhost:5000';
const REG_KEY = 'tutuchapo';
const ADMIN = { email: 'neo-seed@local.dev', password: 'seedpw123' };

const j = async (res) => {
    const text = await res.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error(`${res.status} ${res.url}\n${text}`);
    return body;
};
let TOKEN = '';
const H = () => ({ 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) });
const post = (p, b) => fetch(BASE + p, { method: 'POST', headers: H(), body: JSON.stringify(b) }).then(j);
const get = (p) => fetch(BASE + p, { headers: H() }).then(j);

const iso = (y, m) => new Date(Date.UTC(y, m - 1, 1)).toISOString();

async function auth() {
    // register throwaway admin (ignore if already exists), then login
    try { await post(`/auth/register?key=${REG_KEY}`, ADMIN); }
    catch (e) { if (!/already|exist|conflict|409|email/i.test(String(e.message))) console.log('register note:', e.message.split('\n')[0]); }
    const { access_token } = await post('/auth/login', ADMIN);
    TOKEN = access_token;
}

// ── tech tags: reuse existing TECH by case-insensitive name, else create ──
let techCache = null;
async function loadTech() {
    const tags = await get('/tags?type=TECH');
    techCache = new Map();
    for (const t of tags) {
        const name = t.nameByLocale?.fr ?? t.nameByLocale?.en
            ?? t.translations?.find(x => x.locale === 'fr')?.name
            ?? t.translations?.[0]?.name;
        if (name) techCache.set(name.toLowerCase(), t.id);
    }
}
async function techId(name) {
    const key = name.toLowerCase();
    if (techCache.has(key)) return techCache.get(key);
    const created = await post('/tags', {
        type: 'TECH', isVisible: true, hexColor: '#3b82f6',
        translations: [{ locale: 'fr', name }, { locale: 'en', name }],
    });
    techCache.set(key, created.id);
    console.log(`  + created tag ${name}`);
    return created.id;
}
const techIds = async (names) => Promise.all(names.map(techId));

// ── upsert-ish helpers (idempotent by name) ──
async function ensureEmployer(data) {
    const existing = await get('/companies?kind=EMPLOYER');
    const hit = existing.find(c => c.name === data.name);
    if (hit) { console.log(`= employer ${data.name} exists`); return hit; }
    const c = await post('/companies', { kind: 'EMPLOYER', isVisible: true, ...data });
    console.log(`+ employer ${data.name}`);
    return c;
}
async function ensureClient(parentEmployerId, name) {
    const existing = await get(`/companies?kind=CLIENT&parentEmployerId=${parentEmployerId}`);
    const hit = existing.find(c => c.name === name);
    if (hit) { console.log(`= client ${name} exists`); return hit; }
    const c = await post('/companies', { kind: 'CLIENT', isVisible: true, parentEmployerId, name });
    console.log(`+ client ${name}`);
    return c;
}
async function ensureMission(employerId, clientId, m) {
    const existing = await get(`/missions?employerCompanyId=${employerId}`);
    const hit = existing.find(x => x.clientCompanyId === clientId);
    if (hit) { console.log(`= mission for client ${clientId} exists`); return hit; }
    const created = await post('/missions', {
        employerCompanyId: employerId, clientCompanyId: clientId, isVisible: true, ...m,
    });
    console.log(`+ mission ${m.translations[0].title}`);
    return created;
}

async function main() {
    await auth();
    await loadTech();

    const pit = await ensureEmployer({
        name: 'Pit',
        contractType: 'Permanent', // assumption — change in admin if needed
        employmentStart: iso(2024, 9),
        // employmentEnd omitted → ongoing employer
    });

    // 1) cocoricorando — Sept 2024 → Déc 2024
    const cocorico = await ensureClient(pit.id, 'cocoricorando');
    await ensureMission(pit.id, cocorico.id, {
        startDate: iso(2024, 9), endDate: iso(2024, 12),
        techTagIds: await techIds(['Flutter', 'Typescript', 'Postgresql', 'Git']),
        translations: [
            { locale: 'fr', title: 'Développeur mobile Full-Stack',
              context: 'Application mobile cross-platform (course à pied / running) avec API et persistance dédiées.',
              tasks: ['Développement de l’app Flutter (UI + état)', 'API typée TypeScript adossée à PostgreSQL', 'Mise en place du workflow Git de l’équipe'] },
            { locale: 'en', title: 'Full-Stack Mobile Developer',
              context: 'Cross-platform running mobile app with a dedicated API and storage layer.',
              tasks: ['Built the Flutter app (UI + state)', 'TypeScript-typed API backed by PostgreSQL', 'Set up the team Git workflow'] },
        ],
    });

    // 2) LP Solutions — Déc 2024 → aujourd’hui (ongoing)
    const lp = await ensureClient(pit.id, 'LP Solutions');
    await ensureMission(pit.id, lp.id, {
        startDate: iso(2024, 12), // endDate omitted → ongoing
        techTagIds: await techIds(['Vue3', 'Typescript', 'NestJS', 'MySQL', 'Docker', 'Git', 'Azure DevOps']),
        translations: [
            { locale: 'fr', title: 'Développeur Full-Stack',
              context: 'Plateforme web métier : front Vue 3, back NestJS, base MySQL, le tout conteneurisé et livré via Azure DevOps.',
              tasks: ['Front Vue 3 + TypeScript', 'API NestJS sur MySQL', 'Conteneurisation Docker', 'Pipelines CI/CD Azure DevOps'] },
            { locale: 'en', title: 'Full-Stack Developer',
              context: 'Business web platform: Vue 3 front-end, NestJS back-end, MySQL database, containerized and shipped through Azure DevOps.',
              tasks: ['Vue 3 + TypeScript front-end', 'NestJS API on MySQL', 'Docker containerization', 'Azure DevOps CI/CD pipelines'] },
        ],
    });

    // 3) Playard — Nov 2025 → Déc 2025
    const playard = await ensureClient(pit.id, 'Playard');
    await ensureMission(pit.id, playard.id, {
        startDate: iso(2025, 11), endDate: iso(2025, 12),
        techTagIds: await techIds(['NextJS', 'Vercel', 'Supabase']),
        translations: [
            { locale: 'fr', title: 'Développeur Front-End / Jamstack',
              context: 'Application Next.js déployée sur Vercel, données et auth sur Supabase.',
              tasks: ['App Next.js (App Router)', 'Backend Supabase (DB + auth)', 'Déploiement continu Vercel'] },
            { locale: 'en', title: 'Front-End / Jamstack Developer',
              context: 'Next.js application deployed on Vercel, with Supabase for data and auth.',
              tasks: ['Next.js app (App Router)', 'Supabase backend (DB + auth)', 'Continuous deployment on Vercel'] },
        ],
    });

    console.log('\n✅ Done. Employer "Pit" + 3 clients + 3 missions in place.');
}
main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
