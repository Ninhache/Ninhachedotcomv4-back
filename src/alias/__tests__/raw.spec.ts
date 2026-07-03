import { ProfileController } from '../../profile/profile.controller';
import { AliasService } from '../alias.service';
import { isRaw } from '../raw';

const ageBody =
    "return Math.floor((Date.now() - new Date('2002-05-12')) / 3.15576e10);";

function aliasServiceWithAge(): AliasService {
    const prisma = {
        alias: {
            findMany: jest.fn().mockResolvedValue([
                {
                    key: 'age',
                    bodies: [
                        { locale: 'fr', code: ageBody },
                        { locale: 'en', code: ageBody },
                    ],
                },
            ]),
        },
        project: { count: jest.fn().mockResolvedValue(0) },
    };
    const config = {
        get: (k: string) =>
            ({ 'alias.evalTimeoutMs': 50, 'alias.evalMaxDepth': 20 } as Record<
                string,
                number
            >)[k],
    };
    const svc = new AliasService(prisma as never, config as never);
    svc.clockOverrideMs = Date.UTC(2026, 0, 15, 12, 0, 0); // age -> 23
    return svc;
}

describe('content GET ?raw toggle (acceptance #1/#2)', () => {
    it('profile: ?raw=true keeps @@age verbatim; default resolves to 23', async () => {
        const alias = aliasServiceWithAge();
        const profile = {
            id: 'p',
            name: '',
            updatedAt: '2026-01-01T00:00:00.000Z',
            translations: [
                {
                    locale: 'fr',
                    greeting: '',
                    profession: '',
                    description: 'Je suis un etudiant francais de @@age ans !',
                    skillsTitle: '',
                },
            ],
        };
        const profileService = { get: jest.fn().mockResolvedValue(profile) };
        const controller = new ProfileController(
            profileService as never,
            alias
        );

        const raw: any = await controller.get('fr', 'true');
        expect(raw.translations[0].description).toBe(
            'Je suis un etudiant francais de @@age ans !'
        );

        const resolved: any = await controller.get('fr', undefined);
        expect(resolved.translations[0].description).toBe(
            'Je suis un etudiant francais de 23 ans !'
        );
    });
});

describe('isRaw query toggle (acceptance #3)', () => {
    it('treats only "true"/"1" as raw; everything else resolves', () => {
        expect(isRaw('true')).toBe(true);
        expect(isRaw('1')).toBe(true);
        expect(isRaw('false')).toBe(false);
        expect(isRaw('')).toBe(false);
        expect(isRaw(undefined)).toBe(false);
    });
});
