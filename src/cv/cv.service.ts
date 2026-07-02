import { Injectable } from '@nestjs/common';
import { ContractType, Locale, Prisma } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { AliasService } from 'src/alias/alias.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RevalidationService } from 'src/revalidation/revalidation.service';
import { ResumeService } from 'src/resume/resume.service';
import { GenerateCvDto } from './dto/generate-cv.dto';
import { UpdateCvConfigDto } from './dto/cv-config.dto';
import {
    CvData,
    CvExperience,
    CvSkillGroup,
} from './entities/cv-data';
import { compileLatex, generatedPdfFilename } from './latex/compile';
import { DEFAULT_TEMPLATE, getTemplate, TEMPLATES } from './latex/templates';

/** Default section visibility when the selection does not say otherwise. */
const DEFAULT_SECTIONS = {
    experience: true,
    education: true,
    skills: true,
    projects: false,
    contact: true,
} as const;

const CONTRACT_LABELS: Record<ContractType, Record<Locale, string>> = {
    Permanent: { fr: 'CDI', en: 'Permanent' },
    Fixed: { fr: 'CDD', en: 'Fixed-term' },
    Internship: { fr: 'Stage', en: 'Internship' },
    Workstudy: { fr: 'Alternance', en: 'Apprenticeship' },
    Freelance: { fr: 'Freelance', en: 'Freelance' },
};

type Selection = NonNullable<GenerateCvDto['selection']>;

@Injectable()
export class CvService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly resumeService: ResumeService,
        private readonly revalidation: RevalidationService,
        private readonly alias: AliasService
    ) {}

    /* ------------------------------------------------------------------ */
    /* Config singleton                                                    */
    /* ------------------------------------------------------------------ */

    /**
     * Return the singleton config, creating an empty default on first call.
     *
     * The row is selected by `id` (stable) — NOT `updatedAt`, which moves on
     * every save and would flip the chosen row if duplicates ever exist.
     * Duplicates can appear from a create-if-missing race (e.g. React
     * StrictMode firing the admin loader twice on mount); we self-heal by
     * deleting all but the lowest-id row so the singleton stays canonical.
     */
    async getConfig() {
        const rows = await this.prisma.cvConfig.findMany({
            orderBy: { id: 'asc' },
        });
        if (rows.length === 0) {
            return this.prisma.cvConfig.create({
                data: { template: DEFAULT_TEMPLATE, selection: {} },
            });
        }
        if (rows.length > 1) {
            await this.prisma.cvConfig.deleteMany({
                where: { id: { in: rows.slice(1).map(r => r.id) } },
            });
        }
        return rows[0];
    }

    async updateConfig(dto: UpdateCvConfigDto) {
        const current = await this.getConfig();
        return this.prisma.cvConfig.update({
            where: { id: current.id },
            data: {
                template: dto.template ?? current.template,
                selection:
                    dto.selection !== undefined
                        ? (dto.selection as Prisma.InputJsonValue)
                        : (current.selection as Prisma.InputJsonValue),
            },
        });
    }

    /* ------------------------------------------------------------------ */
    /* Inventory (ids + labels) to drive the admin builder's checkboxes     */
    /* ------------------------------------------------------------------ */

    /**
     * Full list of selectable entries (with ids) for the given locale, so the
     * back-office can render the "choose what to show" checkboxes. Unlike
     * `gatherData` this ignores the saved selection — it always returns
     * everything available.
     */
    async getInventory(locale: Locale) {
        const [companies, education, categories, projects, contacts] =
            await Promise.all([
                this.prisma.company.findMany({
                    where: { kind: 'EMPLOYER' },
                    orderBy: [{ employmentStart: 'desc' }, { order: 'asc' }],
                    include: {
                        employerMissions: {
                            orderBy: { startDate: 'desc' },
                            include: { translations: true },
                        },
                    },
                }),
                this.prisma.education.findMany({
                    orderBy: { startDate: 'desc' },
                    include: { translations: true },
                }),
                this.prisma.skillCategory.findMany({
                    orderBy: { order: 'asc' },
                    include: {
                        translations: true,
                        skillLinks: {
                            orderBy: { order: 'asc' },
                            include: {
                                skill: { include: { translations: true } },
                            },
                        },
                    },
                }),
                this.prisma.project.findMany({
                    orderBy: { startDate: 'desc' },
                    include: { translations: true },
                }),
                this.prisma.contact.findMany({ include: { translations: true } }),
            ]);

        return {
            locale,
            templates: Object.keys(TEMPLATES),
            companies: companies.map(c => ({
                id: c.id,
                name: c.name,
                start: c.employmentStart ?? undefined,
                end: c.employmentEnd ?? undefined,
                missions: c.employerMissions.map(m => ({
                    id: m.id,
                    title: this.tr(m.translations, locale)?.title ?? '',
                    start: m.startDate,
                    end: m.endDate ?? undefined,
                    // Portfolio tasks for this locale — shown as the default /
                    // prefill source for CV bullet overrides in the builder.
                    tasks: this.tr(m.translations, locale)?.tasks ?? [],
                })),
            })),
            education: education.map(ed => ({
                id: ed.id,
                label: `${this.tr(ed.translations, locale)?.degree ?? ''} — ${
                    ed.institutionName
                }`,
                start: ed.startDate,
                end: ed.endDate ?? undefined,
            })),
            skillCategories: categories.map(cat => ({
                id: cat.id,
                name: this.tr(cat.translations, locale)?.name ?? '',
                skills: cat.skillLinks.map(l => ({
                    id: l.skillId,
                    name: this.tr(l.skill.translations, locale)?.name ?? '',
                })),
            })),
            projects: projects.map(p => ({
                id: p.id,
                name: this.tr(p.translations, locale)?.name ?? '',
                start: p.startDate,
                end: p.endDate ?? undefined,
            })),
            contacts: contacts.map(c => ({
                id: c.id,
                label: this.tr(c.translations, locale)?.name ?? c.contactUrl,
            })),
        };
    }

    /* ------------------------------------------------------------------ */
    /* Generation                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Generate the CV PDF(s) for the requested locale(s), store them under
     * `uploads/`, remember them on the config, and optionally publish them as
     * the public Resume.
     *
     * @param dto generation options (locale, template, selection, publish, save)
     * @returns the generated `/uploads/...` URL(s) keyed by locale
     */
    async generate(
        dto: GenerateCvDto
    ): Promise<{ urls: { fr?: string; en?: string } }> {
        const config = await this.getConfig();
        const template = dto.template ?? config.template ?? DEFAULT_TEMPLATE;
        const selection: Selection =
            dto.selection ?? ((config.selection as Selection) || {});

        if (dto.save) {
            await this.updateConfig({ template, selection });
        }

        const locales: Locale[] =
            dto.locale === 'fr'
                ? ['fr']
                : dto.locale === 'en'
                  ? ['en']
                  : ['fr', 'en'];

        const urls: { fr?: string; en?: string } = {};
        const publishFiles: { locale: 'fr' | 'en'; filename: string }[] = [];

        for (const locale of locales) {
            const data = await this.gatherData(locale, selection);
            const tex = getTemplate(template)(data);
            const pdf = await compileLatex(tex);

            const filename = generatedPdfFilename();
            await writeFile(join(this.uploadsDir, filename), pdf);
            const url = `/uploads/${filename}`;
            urls[locale] = url;
            publishFiles.push({ locale, filename });

            // Drop the previously generated file for this locale (best effort).
            const prev =
                locale === 'fr' ? config.generatedFrUrl : config.generatedEnUrl;
            await this.unlinkByUrl(prev);
        }

        await this.prisma.cvConfig.update({
            where: { id: config.id },
            data: {
                generatedFrUrl: urls.fr ?? config.generatedFrUrl,
                generatedEnUrl: urls.en ?? config.generatedEnUrl,
            },
        });

        if (dto.publish) {
            await this.resumeService.promoteFromFilenames(publishFiles);
            // The ResumeController interceptor isn't on this code path, so fire
            // the same cache-tag invalidation it would have emitted.
            await this.revalidation.revalidate([
                'resume',
                'resume:fr',
                'resume:en',
            ]);
        }

        return { urls };
    }

    /* ------------------------------------------------------------------ */
    /* Data gathering: DB -> locale-resolved, selection-filtered CvData    */
    /* ------------------------------------------------------------------ */

    /**
     * Build the CV view model for one locale, honouring the selection
     * (section toggles + per-entity id allow-lists). Exposed for the admin
     * "data inventory" endpoint and reused by generation.
     */
    async gatherData(locale: Locale, selection: Selection): Promise<CvData> {
        const sections = { ...DEFAULT_SECTIONS, ...(selection.sections ?? {}) };
        const ids = selection.includeIds ?? {};
        const summary = selection.summary?.[locale] ?? '';

        const data: CvData = {
            locale,
            header: await this.buildHeader(
                locale,
                sections.contact,
                ids,
                summary,
                selection.extraLinks,
                selection.phone
            ),
            experiences: sections.experience
                ? await this.buildExperiences(
                      locale,
                      ids,
                      selection.bulletsByMission
                  )
                : [],
            education: sections.education
                ? await this.buildEducation(locale, ids)
                : [],
            skillGroups: sections.skills
                ? await this.buildSkillGroups(locale, ids)
                : [],
            spokenLanguages:
                selection.spokenLanguages?.[locale]?.trim() || undefined,
            projects: sections.projects
                ? await this.buildProjects(
                      locale,
                      ids,
                      selection.roleByProject,
                      selection.bulletsByProject
                  )
                : [],
            projectsNote: selection.projectsNote?.[locale]?.trim() || undefined,
            projectsNoteUrl: selection.projectsNoteUrl?.trim() || undefined,
            activities: this.buildActivities(locale, selection.activities),
            references: (selection.references ?? [])
                .filter(r => r?.name)
                .map(r => ({
                    name: r.name,
                    title: r.title?.trim() || undefined,
                    org: r.org?.trim() || undefined,
                    contact: r.contact?.trim() || undefined,
                    url: r.url?.trim() || undefined,
                })),
            referencesNote:
                selection.referencesNote?.[locale]?.trim() || undefined,
        };

        // Resolve @@markers (@@age, @@email, ...) the same way the public
        // endpoints do, so no raw alias leaks into the PDF. Date fields are
        // treated as leaves by resolveObject, so they pass through untouched.
        return this.alias.resolveObject(data, locale);
    }

    private keep(list: string[] | undefined, id: string): boolean {
        return list === undefined || list.includes(id);
    }

    private tr<T extends { locale: Locale }>(
        rows: T[],
        locale: Locale
    ): T | undefined {
        return rows.find(r => r.locale === locale) ?? rows[0];
    }

    private async buildHeader(
        locale: Locale,
        includeContacts: boolean,
        ids: NonNullable<Selection['includeIds']>,
        summary: string,
        extraLinks: Selection['extraLinks'],
        phone: Selection['phone']
    ): Promise<CvData['header']> {
        const profile = await this.prisma.profile.findFirst({
            include: { translations: true },
            orderBy: { updatedAt: 'desc' },
        });
        const pt = profile ? this.tr(profile.translations, locale) : undefined;

        const contactRows = includeContacts
            ? await this.prisma.contact.findMany({
                  include: { translations: true },
              })
            : [];
        const byId = new Map(contactRows.map(c => [c.id, c]));
        // Order follows `ids.contacts` when provided (so the operator controls
        // link order); otherwise fall back to the DB order.
        const ordered = (ids.contacts ?? contactRows.map(c => c.id))
            .map(id => byId.get(id))
            .filter((c): c is (typeof contactRows)[number] => Boolean(c));

        const contacts = ordered.map(c => ({
            label: this.tr(c.translations, locale)?.name ?? c.contactUrl,
            url: c.contactUrl,
        }));
        // Extra, non-Contact header links (e.g. portfolio), appended in order.
        for (const l of extraLinks ?? []) {
            if (l?.url) contacts.push({ label: l.label || l.url, url: l.url });
        }

        return {
            name: profile?.name ?? '',
            profession: pt?.profession ?? '',
            phone: phone?.trim() || undefined,
            // The CV summary is the operator-written professional one (may be
            // empty), NOT the catchy portfolio Profile.description.
            summary,
            contacts,
        };
    }

    private async buildExperiences(
        locale: Locale,
        ids: NonNullable<Selection['includeIds']>,
        bulletsByMission: Selection['bulletsByMission']
    ): Promise<CvExperience[]> {
        const employers = await this.prisma.company.findMany({
            where: { kind: 'EMPLOYER' },
            include: {
                translations: true,
                positions: { include: { translations: true } },
                employerMissions: {
                    include: {
                        translations: true,
                        clientCompany: true,
                    },
                },
            },
            // Most recent employer first (CV convention); ties fall back to order.
            orderBy: [{ employmentStart: 'desc' }, { order: 'asc' }],
        });

        return employers
            .filter(c => this.keep(ids.companies, c.id))
            .map(c => {
                const roles = [...c.positions]
                    .sort(
                        (a, b) =>
                            (b.startDate?.getTime() ?? 0) -
                            (a.startDate?.getTime() ?? 0)
                    )
                    .map(p => this.tr(p.translations, locale)?.title ?? '')
                    .filter(Boolean);

                const missions = c.employerMissions
                    .filter(m => this.keep(ids.missions, m.id))
                    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                    .map(m => {
                        const mt = this.tr(m.translations, locale);
                        // Operator-written CV bullets win over portfolio tasks
                        // (which are duty-phrased, not achievement-framed).
                        const override = (
                            bulletsByMission?.[m.id]?.[locale] ?? []
                        )
                            .map(b => String(b).trim())
                            .filter(Boolean);
                        return {
                            title: mt?.title ?? '',
                            client: m.clientCompany?.name ?? undefined,
                            context: mt?.context ?? undefined,
                            startDate: m.startDate,
                            endDate: m.endDate ?? undefined,
                            bullets: override.length ? override : mt?.tasks ?? [],
                        };
                    });

                return {
                    company: c.name,
                    location: c.localisation ?? undefined,
                    contract: c.contractType
                        ? CONTRACT_LABELS[c.contractType][locale]
                        : undefined,
                    startDate: c.employmentStart ?? undefined,
                    endDate: c.employmentEnd ?? undefined,
                    roles,
                    missions,
                };
            });
    }

    private async buildEducation(
        locale: Locale,
        ids: NonNullable<Selection['includeIds']>
    ): Promise<CvData['education']> {
        const rows = await this.prisma.education.findMany({
            include: { translations: true },
            orderBy: { startDate: 'desc' },
        });
        return rows
            .filter(ed => this.keep(ids.education, ed.id))
            .map(ed => {
                const t = this.tr(ed.translations, locale);
                return {
                    institution: ed.institutionName,
                    degree: t?.degree ?? '',
                    description: t?.description ?? undefined,
                    startDate: ed.startDate,
                    endDate: ed.endDate ?? undefined,
                };
            });
    }

    private async buildSkillGroups(
        locale: Locale,
        ids: NonNullable<Selection['includeIds']>
    ): Promise<CvSkillGroup[]> {
        const categories = await this.prisma.skillCategory.findMany({
            include: {
                translations: true,
                skillLinks: {
                    orderBy: { order: 'asc' },
                    include: { skill: { include: { translations: true } } },
                },
            },
            orderBy: { order: 'asc' },
        });

        return categories
            .map(cat => ({
                category: this.tr(cat.translations, locale)?.name ?? '',
                skills: cat.skillLinks
                    .filter(l => this.keep(ids.skills, l.skillId))
                    .map(l => this.tr(l.skill.translations, locale)?.name ?? '')
                    .filter(Boolean),
            }))
            .filter(g => g.skills.length > 0);
    }

    private async buildProjects(
        locale: Locale,
        ids: NonNullable<Selection['includeIds']>,
        roleByProject: Selection['roleByProject'],
        bulletsByProject: Selection['bulletsByProject']
    ): Promise<CvData['projects']> {
        const rows = await this.prisma.project.findMany({
            include: { translations: true },
            orderBy: { startDate: 'desc' },
        });
        const byId = new Map(rows.map(p => [p.id, p]));
        // Order follows `ids.projects` when provided (operator-controlled, e.g.
        // featured project first); otherwise newest-first.
        const ordered = (ids.projects ?? rows.map(p => p.id))
            .map(id => byId.get(id))
            .filter((p): p is (typeof rows)[number] => Boolean(p));
        return ordered
            .map(p => {
                const t = this.tr(p.translations, locale);
                const role = roleByProject?.[p.id]?.[locale]?.trim() || undefined;
                const bullets = (bulletsByProject?.[p.id]?.[locale] ?? [])
                    .map(b => String(b).trim())
                    .filter(Boolean);
                return {
                    name: t?.name ?? '',
                    description: t?.description ?? '',
                    url: p.visitUrl ?? p.gitUrl ?? undefined,
                    startDate: p.startDate,
                    endDate: p.endDate ?? undefined,
                    role,
                    bullets,
                };
            });
    }

    /** Map the operator-authored activities config to the locale's view. */
    private buildActivities(
        locale: Locale,
        activities: Selection['activities']
    ): CvData['activities'] {
        return (activities ?? [])
            .filter(a => a?.org)
            .map(a => ({
                org: a.org,
                role: a.role?.[locale]?.trim() || undefined,
                dates: a.dates?.trim() || undefined,
                bullets: (a.bullets?.[locale] ?? [])
                    .map(b => String(b).trim())
                    .filter(Boolean),
            }));
    }

    /* ------------------------------------------------------------------ */
    /* uploads/ helpers (mirrors ResumeService, guarded against traversal) */
    /* ------------------------------------------------------------------ */

    private get uploadsDir(): string {
        return join(__dirname, '..', '..', 'uploads');
    }

    private async unlinkByUrl(url: string | null | undefined): Promise<void> {
        if (!url || !url.startsWith('/uploads/')) return;
        const filename = url.replace('/uploads/', '');
        const base = this.uploadsDir;
        const filePath = join(base, filename);
        if (filePath !== join(base, '.') && !filePath.startsWith(base + '/')) {
            return; // resolved outside uploads — refuse to delete
        }
        try {
            const { unlink } = await import('fs/promises');
            await unlink(filePath);
        } catch {
            // already gone — ignore
        }
    }
}
