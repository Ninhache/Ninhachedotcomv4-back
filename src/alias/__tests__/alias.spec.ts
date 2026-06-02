import { Logger } from '@nestjs/common';
import { AliasService } from '../alias.service';

// ── Seed bodies (verbatim from prisma/seed.ts) ───────────────────────────────
const ageBody =
    "return Math.floor((Date.now() - new Date('2002-05-12')) / 3.15576e10);";
const exampleBody = 'return $.age % 4;';
const greetFr =
    "const h=+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Europe/Paris'}).format(new Date()); return ['Bonsoir','Bonjour','Bon apres-midi','Bonsoir'][h<6?0:h<12?1:h<18?2:3];";
const greetEn =
    "const h=+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Europe/Paris'}).format(new Date()); return ['Good evening','Good morning','Good afternoon','Good evening'][h<6?0:h<12?1:h<18?2:3];";
const emailBody = "return 'moi@exemple.fr';";
const projCountBody = 'return String($.projectCount);';

type AliasSeed = { key: string; fr: string; en: string };

const DEFAULT_ALIASES: AliasSeed[] = [
    { key: 'age', fr: ageBody, en: ageBody },
    { key: 'example', fr: exampleBody, en: exampleBody },
    { key: 'greeting', fr: greetFr, en: greetEn },
    { key: 'email', fr: emailBody, en: emailBody },
    { key: 'projectCount', fr: projCountBody, en: projCountBody },
];

function makeService(opts?: {
    aliases?: AliasSeed[];
    projectCount?: number;
}): AliasService {
    const aliases = opts?.aliases ?? DEFAULT_ALIASES;
    const prisma = {
        alias: {
            findMany: jest.fn().mockResolvedValue(
                aliases.map(a => ({
                    key: a.key,
                    bodies: [
                        { locale: 'fr', code: a.fr },
                        { locale: 'en', code: a.en },
                    ],
                }))
            ),
        },
        project: {
            count: jest.fn().mockResolvedValue(opts?.projectCount ?? 0),
        },
    };
    const config = {
        get: (k: string) =>
            (
                {
                    'alias.evalTimeoutMs': 50,
                    'alias.evalMaxDepth': 20,
                } as Record<string, number>
            )[k],
    };
    return new AliasService(prisma as never, config as never);
}

// Fixed instants (UTC). Paris is UTC+1 in January (winter), so 08:00Z = 09:00
// Paris and 22:00Z = 23:00 Paris.
const AGE_NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const PARIS_0900 = Date.UTC(2026, 0, 15, 8, 0, 0);
const PARIS_2300 = Date.UTC(2026, 0, 15, 22, 0, 0);

describe('AliasService', () => {
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
        errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => jest.restoreAllMocks());

    it('age: "j\'ai @@age ans" -> "j\'ai 23 ans"', async () => {
        const svc = makeService();
        svc.clockOverrideMs = AGE_NOW;
        // sanity: the chosen instant really yields 23 with the seed formula
        const expected = Math.floor(
            (AGE_NOW - new Date('2002-05-12').getTime()) / 3.15576e10
        );
        expect(expected).toBe(23);
        await expect(svc.resolveText("j'ai @@age ans", 'fr')).resolves.toBe(
            "j'ai 23 ans"
        );
    });

    it('example: "@@example" with age=23 -> "3" (composition)', async () => {
        const svc = makeService();
        svc.clockOverrideMs = AGE_NOW; // age=23 -> 23 % 4 = 3
        await expect(svc.resolveText('@@example', 'fr')).resolves.toBe('3');
    });

    it('greeting fr at 09:00 Paris -> "Bonjour"', async () => {
        const svc = makeService();
        svc.clockOverrideMs = PARIS_0900;
        await expect(svc.resolveText('@@greeting', 'fr')).resolves.toBe(
            'Bonjour'
        );
    });

    it('greeting en at 23:00 Paris -> "Good evening"', async () => {
        const svc = makeService();
        svc.clockOverrideMs = PARIS_2300;
        await expect(svc.resolveText('@@greeting', 'en')).resolves.toBe(
            'Good evening'
        );
    });

    it('email: fixed-text body -> "moi@exemple.fr"', async () => {
        const svc = makeService();
        await expect(svc.resolveText('@@email', 'fr')).resolves.toBe(
            'moi@exemple.fr'
        );
    });

    it('projectCount: feed injected into $ -> "7"', async () => {
        const svc = makeService({ projectCount: 7 });
        await expect(svc.resolveText('@@projectCount', 'fr')).resolves.toBe(
            '7'
        );
    });

    it('unknown marker is left raw + warns', async () => {
        const svc = makeService();
        await expect(svc.resolveText('@@unknown ici', 'fr')).resolves.toBe(
            '@@unknown ici'
        );
        expect(warnSpy).toHaveBeenCalled();
    });

    it('escape: "prix @@@@ promo" -> "prix @@ promo"', async () => {
        const svc = makeService();
        await expect(svc.resolveText('prix @@@@ promo', 'fr')).resolves.toBe(
            'prix @@ promo'
        );
    });

    it('escape does not resolve: "@@@@age" -> "@@age"', async () => {
        const svc = makeService();
        await expect(svc.resolveText('@@@@age', 'fr')).resolves.toBe('@@age');
    });

    it('cycle: a<->b -> "" + error, no throw', async () => {
        const svc = makeService({
            aliases: [
                { key: 'a', fr: 'return $.b', en: 'return $.b' },
                { key: 'b', fr: 'return $.a', en: 'return $.a' },
            ],
        });
        await expect(svc.resolveText('@@a', 'fr')).resolves.toBe('');
        expect(errorSpy).toHaveBeenCalled();
    });

    it('timeout: infinite loop -> "" + error, no throw', async () => {
        const svc = makeService({
            aliases: [{ key: 'loop', fr: 'while(true){}', en: 'while(true){}' }],
        });
        await expect(svc.resolveText('@@loop', 'fr')).resolves.toBe('');
        expect(errorSpy).toHaveBeenCalled();
    });

    it('resolveObject deep-resolves all string fields', async () => {
        const svc = makeService({ projectCount: 7 });
        const input = {
            id: 'p1',
            translations: [
                { locale: 'fr', description: 'j@@@@home, @@projectCount projets' },
            ],
            nested: { note: '@@email' },
        };
        const out = await svc.resolveObject(input, 'fr');
        expect(out.translations[0].description).toBe('j@@home, 7 projets');
        expect(out.nested.note).toBe('moi@exemple.fr');
        expect(out.id).toBe('p1');
    });

    it('resolveObject resolves each translation in its own locale', async () => {
        const svc = makeService();
        svc.clockOverrideMs = PARIS_0900; // 09:00 Paris -> Bonjour / Good morning
        const input = {
            translations: [
                { locale: 'fr', greeting: '@@greeting' },
                { locale: 'en', greeting: '@@greeting' },
            ],
        };
        // request default locale is 'en', but each row uses its own locale
        const out = await svc.resolveObject(input, 'en');
        expect(out.translations[0].greeting).toBe('Bonjour');
        expect(out.translations[1].greeting).toBe('Good morning');
    });

    it('resolveObject leaves Date (and non-plain) values intact', async () => {
        const svc = makeService();
        const d = new Date('2020-01-02T03:04:05.000Z');
        const out = await svc.resolveObject({ date: d, name: 'plain' }, 'fr');
        expect(out.date).toBeInstanceOf(Date);
        expect((out.date as Date).getTime()).toBe(d.getTime());
    });

    it('resolveObject respects a fields whitelist', async () => {
        const svc = makeService({ projectCount: 7 });
        const input = { a: '@@projectCount', b: '@@projectCount' };
        const out = await svc.resolveObject(input, 'fr', ['a']);
        expect(out.a).toBe('7');
        expect(out.b).toBe('@@projectCount'); // not in whitelist -> untouched
    });
});
