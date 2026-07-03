import { CvData } from '../../entities/cv-data';
import { renderCern } from './cern';

function baseData(overrides: Partial<CvData> = {}): CvData {
    return {
        locale: 'en',
        header: {
            name: 'Néo Almeida',
            profession: 'Software Engineer',
            summary: 'Builder.',
            contacts: [{ label: 'GitHub', url: 'https://github.com/x' }],
        },
        experiences: [],
        education: [],
        skillGroups: [],
        projects: [],
        activities: [],
        references: [],
        ...overrides,
    };
}

describe('renderCern', () => {
    it('produces a complete document with no pdfTeX-only primitives', () => {
        const tex = renderCern(baseData());
        expect(tex).toContain('\\documentclass[letterpaper,11pt]{article}');
        expect(tex).toContain('\\begin{document}');
        expect(tex).toContain('\\end{document}');
        // These break under Tectonic's XeTeX engine — must be absent.
        expect(tex).not.toContain('\\pdfgentounicode');
        expect(tex).not.toContain('glyphtounicode');
        expect(tex).not.toContain('fontenc');
    });

    it('renders a project with an operator role and bullets', () => {
        const tex = renderCern(
            baseData({
                projects: [
                    {
                        name: 'Wakfuli',
                        description: 'A builder.',
                        url: 'https://wakfuli.com/',
                        role: 'Founder & lead developer',
                        bullets: ['Founded and led a 3-person team.'],
                    },
                ],
            })
        );
        expect(tex).toContain('\\textbf{Wakfuli}');
        expect(tex).toContain('Founder \\& lead developer');
        expect(tex).toContain('\\resumeItem{Founded and led a 3-person team}');
        // With bullets present, the raw description is not used.
        expect(tex).not.toContain('A builder.');
    });

    it('falls back to the project description when no bullets', () => {
        const tex = renderCern(
            baseData({
                projects: [
                    { name: 'NinIde', description: 'A C editor.', bullets: [] },
                ],
            })
        );
        expect(tex).toContain('A C editor');
    });

    it('renders a Leadership & Activities entry', () => {
        const tex = renderCern(
            baseData({
                activities: [
                    {
                        org: 'Erasmus Student Network',
                        role: 'Member',
                        dates: 'Jan 2025 -- Present',
                        bullets: ['Organize events for international students.'],
                    },
                ],
            })
        );
        expect(tex).toContain('Leadership \\& Activities');
        expect(tex).toContain('Erasmus Student Network');
        expect(tex).toContain(
            '\\resumeItem{Organize events for international students}'
        );
    });

    it('flattens selected missions bullets under the employer heading', () => {
        const tex = renderCern(
            baseData({
                experiences: [
                    {
                        company: 'PIT',
                        contract: 'Apprenticeship',
                        roles: ['Full-Stack & DevOps Engineer'],
                        startDate: new Date('2024-09-01'),
                        missions: [
                            {
                                title: 'm',
                                startDate: new Date('2025-01-01'),
                                bullets: ['Owned CI/CD on Azure DevOps.'],
                            },
                        ],
                    },
                ],
            })
        );
        expect(tex).toContain('Experience');
        expect(tex).toContain('Full-Stack \\& DevOps Engineer');
        expect(tex).toContain('PIT - Apprenticeship');
        expect(tex).toContain('\\resumeItem{Owned CI/CD on Azure DevOps}');
    });

    it('bolds **markup** in a bullet and drops the trailing period', () => {
        const tex = renderCern(
            baseData({
                experiences: [
                    {
                        company: 'PIT',
                        roles: ['Engineer'],
                        startDate: new Date('2024-09-01'),
                        missions: [
                            {
                                title: 'm',
                                startDate: new Date('2025-01-01'),
                                bullets: ['Cut release time by **75%**.'],
                            },
                        ],
                    },
                ],
            })
        );
        // ** -> \textbf, % escaped, trailing period removed, markup consumed.
        expect(tex).toContain(
            '\\resumeItem{Cut release time by \\textbf{75\\%}}'
        );
        expect(tex).not.toContain('**');
    });

    it('renders a References section with a linked contact', () => {
        const tex = renderCern(
            baseData({
                references: [
                    {
                        name: 'Jane Doe',
                        title: 'Lead Engineer',
                        org: 'PIT',
                        contact: 'jane@pit.fr',
                        url: 'mailto:jane@pit.fr',
                    },
                ],
            })
        );
        expect(tex).toContain('References');
        expect(tex).toContain('Jane Doe');
        expect(tex).toContain('Lead Engineer, PIT');
        expect(tex).toContain('\\href{mailto:jane@pit.fr}');
    });

    it('renders a spoken-languages line in skills', () => {
        const tex = renderCern(
            baseData({
                skillGroups: [{ category: 'Languages', skills: ['C', 'Rust'] }],
                spokenLanguages: 'French (native), English (professional)',
            })
        );
        expect(tex).toContain('Technical Skills');
        expect(tex).toContain('French (native), English (professional)');
    });
});
