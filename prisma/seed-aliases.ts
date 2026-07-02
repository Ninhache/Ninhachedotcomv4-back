/**
 * Additive, idempotent alias seeder — safe to run on a populated database.
 *
 * Unlike `prisma/seed.ts` (which wipes & rebuilds all content), this ONLY
 * upserts the default aliases by key and performs NO deletes. Existing aliases
 * are left untouched (update: {}), so it won't clobber edits made via the admin
 * back-office.
 *
 *   npx ts-node prisma/seed-aliases.ts
 */
import { Locale, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ageBody =
    "return Math.floor((Date.now() - new Date('2002-06-27')) / 3.15576e10);";
const exampleBody = 'return $.age % 4;';
const greetFr =
    "const h=+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Europe/Paris'}).format(new Date()); return ['Bonsoir','Bonjour','Bon apres-midi','Bonsoir'][h<6?0:h<12?1:h<18?2:3];";
const greetEn =
    "const h=+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Europe/Paris'}).format(new Date()); return ['Good evening','Good morning','Good afternoon','Good evening'][h<6?0:h<12?1:h<18?2:3];";
const emailBody = "return 'moi@exemple.fr';";
const projCountBody = 'return String($.projectCount);';

const aliasSeed: { key: string; fr: string; en: string }[] = [
    { key: 'age', fr: ageBody, en: ageBody },
    { key: 'example', fr: exampleBody, en: exampleBody },
    { key: 'greeting', fr: greetFr, en: greetEn },
    { key: 'email', fr: emailBody, en: emailBody },
    { key: 'projectCount', fr: projCountBody, en: projCountBody },
];

async function main() {
    let created = 0;
    for (const a of aliasSeed) {
        const existing = await prisma.alias.findUnique({
            where: { key: a.key },
        });
        if (existing) {
            console.log(`↷ alias '${a.key}' already exists — skipped`);
            continue;
        }
        await prisma.alias.create({
            data: {
                key: a.key,
                bodies: {
                    create: [
                        { locale: Locale.fr, code: a.fr },
                        { locale: Locale.en, code: a.en },
                    ],
                },
            },
        });
        created++;
        console.log(`✅ alias '${a.key}' created`);
    }
    console.log(`\nDone — ${created} alias(es) created, ${aliasSeed.length - created} skipped.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
