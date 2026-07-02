/**
 * One-shot, idempotent data migration: lifts the legacy flat `Experience` rows
 * into the new timeline structure (`Company` of kind EMPLOYER + `Mission`).
 *
 * Mapping per Experience:
 *   - one EMPLOYER `Company` per distinct companyName, carrying the contract:
 *       contractType, startDate→employmentStart, endDate→employmentEnd,
 *       siteUrl, localisation, imageUrl→logoUrl, isVisible.
 *   - one `Mission` under that employer:
 *       startDate/endDate, isVisible, order, EXPERIENCE_TECH tags reconnected
 *       as-is (NOT retyped to MISSION_TECH — left for manual review in admin),
 *       translations jobTitle→title, description→context, tasks → [].
 *
 * Deterministic, re-runnable IDs (so a second run updates instead of duplicating):
 *   company id = `mig-company-<slug(companyName)>`
 *   mission id = `mig-mission-<experienceId>`
 *
 * The original Experience rows are left untouched (non-destructive). Review the
 * result in the admin, set client companies / mission tasks, then optionally
 * hide the legacy experiences.
 *
 * Run:  npx ts-node prisma/migrate-experiences-to-timeline.ts
 */
import { CompanyKind, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slug = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip combining accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

async function main() {
    const experiences = await prisma.experience.findMany({
        include: { translations: true, tags: true },
        orderBy: { order: 'asc' },
    });

    if (experiences.length === 0) {
        console.log('No experiences to migrate.');
        return;
    }

    // 1) One EMPLOYER company per distinct companyName. Use the earliest start /
    //    latest end across that company's experiences as the employment window.
    const byCompany = new Map<string, typeof experiences>();
    for (const exp of experiences) {
        const list = byCompany.get(exp.companyName) ?? [];
        list.push(exp);
        byCompany.set(exp.companyName, list);
    }

    const companyIdByName = new Map<string, string>();

    for (const [companyName, exps] of byCompany) {
        const companyId = `mig-company-${slug(companyName)}`;
        companyIdByName.set(companyName, companyId);

        const employmentStart = exps
            .map(e => e.startDate)
            .reduce((a, b) => (a < b ? a : b));
        const employmentEnd = exps
            .map(e => e.endDate)
            .reduce((a, b) => (a > b ? a : b));
        // Representative experience for locale-independent company fields.
        const rep = exps[0];

        const data = {
            kind: CompanyKind.EMPLOYER,
            name: companyName,
            localisation: rep.localisation,
            siteUrl: rep.siteUrl,
            logoUrl: rep.imageUrl,
            isVisible: exps.some(e => e.isVisible),
            order: rep.order,
            contractType: rep.contractType,
            employmentStart,
            employmentEnd,
        };

        await prisma.company.upsert({
            where: { id: companyId },
            create: { id: companyId, ...data },
            update: data,
        });
        console.log(`company  ✓ ${companyName} (${companyId})`);
    }

    // 2) One Mission per Experience under its employer company.
    for (const exp of experiences) {
        const missionId = `mig-mission-${exp.id}`;
        const employerCompanyId = companyIdByName.get(exp.companyName)!;

        const translationRows = exp.translations.map(t => ({
            locale: t.locale,
            title: t.jobTitle,
            context: t.description,
            tasks: [] as string[],
        }));
        const tagConnect = exp.tags.map(t => ({ id: t.id }));

        await prisma.mission.upsert({
            where: { id: missionId },
            create: {
                id: missionId,
                employerCompany: { connect: { id: employerCompanyId } },
                startDate: exp.startDate,
                endDate: exp.endDate,
                isVisible: exp.isVisible,
                order: exp.order,
                techTags: { connect: tagConnect },
                translations: { create: translationRows },
            },
            update: {
                employerCompany: { connect: { id: employerCompanyId } },
                startDate: exp.startDate,
                endDate: exp.endDate,
                isVisible: exp.isVisible,
                order: exp.order,
                techTags: { set: tagConnect },
                translations: { deleteMany: {}, create: translationRows },
            },
        });
        console.log(`mission  ✓ ${exp.companyName} — ${exp.id} (${missionId})`);
    }

    console.log(
        `\nMigrated ${experiences.length} experience(s) into ${byCompany.size} employer compan${byCompany.size === 1 ? 'y' : 'ies'}.`
    );
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
