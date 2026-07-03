import { CvData } from '../../entities/cv-data';
import { renderInternational } from './international';

function baseData(overrides: Partial<CvData> = {}): CvData {
    return {
        locale: 'en',
        header: {
            name: 'Neo Almeida',
            profession: 'Software Engineer',
            summary: 'Builder of things.',
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

describe('renderInternational', () => {
    it('produces a complete LaTeX document', () => {
        const tex = renderInternational(baseData());
        expect(tex).toContain('\\documentclass');
        expect(tex).toContain('\\begin{document}');
        expect(tex).toContain('\\end{document}');
        expect(tex).toContain('Neo Almeida');
    });

    it('escapes special characters from DB content', () => {
        const tex = renderInternational(
            baseData({
                header: {
                    name: 'R&D Lead',
                    profession: '',
                    summary: '',
                    contacts: [],
                },
            })
        );
        expect(tex).toContain('R\\&D Lead');
        expect(tex).not.toMatch(/R&D Lead/);
    });

    it('renders mission task bullets', () => {
        const tex = renderInternational(
            baseData({
                experiences: [
                    {
                        company: 'CERN',
                        roles: ['Intern'],
                        missions: [
                            {
                                title: 'Detector tooling',
                                startDate: new Date('2026-02-01'),
                                bullets: ['Built a pipeline', 'Shipped a tool'],
                            },
                        ],
                    },
                ],
            })
        );
        expect(tex).toContain('Experience');
        expect(tex).toContain('CERN');
        expect(tex).toContain('\\item Built a pipeline');
        expect(tex).toContain('\\item Shipped a tool');
    });

    it('omits sections that have no entries', () => {
        const tex = renderInternational(baseData());
        expect(tex).not.toContain('\\section*{Experience}');
        expect(tex).not.toContain('\\section*{Education}');
        expect(tex).not.toContain('\\section*{Skills}');
    });

    it('localises section titles and the "present" marker in French', () => {
        const tex = renderInternational(
            baseData({
                locale: 'fr',
                experiences: [
                    {
                        company: 'ACME',
                        startDate: new Date('2024-09-01'),
                        roles: [],
                        missions: [
                            {
                                title: 'Mission',
                                startDate: new Date('2024-09-01'),
                                bullets: [],
                            },
                        ],
                    },
                ],
            })
        );
        expect(tex).toContain('\\section*{Expérience}');
        expect(tex).toContain("Aujourd'hui");
    });
});
