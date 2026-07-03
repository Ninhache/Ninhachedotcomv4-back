// Reparent the 3 client missions onto the EXISTING "PIT" (Workstudy) employer,
// then delete the duplicate "Pit" I mistakenly created.
const BASE = 'http://localhost:5000';
const ADMIN = { email: 'neo-seed@local.dev', password: 'seedpw123' };

const j = async (res) => {
    const text = await res.text();
    let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error(`${res.status} ${res.url}\n${text}`);
    return body;
};
let TOKEN = '';
const H = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` });
const req = (m, p, b) => fetch(BASE + p, { method: m, headers: H(), body: b ? JSON.stringify(b) : undefined }).then(j);

async function main() {
    ({ access_token: TOKEN } = await fetch(BASE + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ADMIN),
    }).then(j));

    const employers = await req('GET', '/companies?kind=EMPLOYER');
    const real = employers.find(c => c.name === 'PIT');      // migrated, Workstudy
    const dup = employers.find(c => c.name === 'Pit');       // my duplicate
    if (!real) throw new Error('Existing PIT not found');
    if (!dup) { console.log('No duplicate "Pit" — nothing to do.'); return; }
    console.log(`real PIT = ${real.id} (${real.contractType}) | dup Pit = ${dup.id}`);

    // 1) reparent clients of dup → real
    const clients = await req('GET', `/companies?kind=CLIENT&parentEmployerId=${dup.id}`);
    for (const c of clients) {
        await req('PATCH', `/companies/${c.id}`, { parentEmployerId: real.id });
        console.log(`reparented client ${c.name} → PIT`);
    }
    // 2) reassign missions of dup → real
    const missions = await req('GET', `/missions?employerCompanyId=${dup.id}`);
    for (const m of missions) {
        await req('PATCH', `/missions/${m.id}`, { employerCompanyId: real.id });
        const t = m.translations.find(x => x.locale === 'fr') || m.translations[0];
        console.log(`reassigned mission "${t.title}" → PIT`);
    }
    // 3) delete the now-empty duplicate employer
    await req('DELETE', `/companies/${dup.id}`);
    console.log('deleted duplicate "Pit"');

    console.log('\n✅ Dedupe done.');
}
main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
