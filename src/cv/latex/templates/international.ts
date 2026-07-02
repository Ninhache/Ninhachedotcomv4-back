import { Locale } from '@prisma/client';
import { CvData } from '../../entities/cv-data';
import { escapeLatex } from '../escape';

/**
 * Default "international / American" CV template. Single column, ATS-friendly,
 * one page where possible. Rendered for the XeTeX engine that Tectonic ships
 * with (Unicode-native — so NO `inputenc`/`fontenc`; the default Latin Modern
 * font handles French accents).
 *
 * This is intentionally self-contained and dependency-light so a first
 * compilation fetches few packages. Replace/extend with the author's own `.tex`
 * by adding a sibling template module and wiring its key in `TEMPLATES`.
 */

const MONTHS: Record<Locale, string[]> = {
    fr: [
        'janv.',
        'févr.',
        'mars',
        'avr.',
        'mai',
        'juin',
        'juil.',
        'août',
        'sept.',
        'oct.',
        'nov.',
        'déc.',
    ],
    en: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ],
};

const LABELS: Record<Locale, Record<string, string>> = {
    fr: {
        experience: 'Expérience',
        education: 'Formation',
        skills: 'Compétences',
        projects: 'Projets',
        activities: 'Engagements \\& Activités',
        spoken: 'Langues',
        present: "Aujourd'hui",
    },
    en: {
        experience: 'Experience',
        education: 'Education',
        skills: 'Skills',
        projects: 'Projects',
        activities: 'Leadership \\& Activities',
        spoken: 'Spoken',
        present: 'Present',
    },
};

function fmtMonth(d: Date | undefined, locale: Locale): string {
    if (!d) return LABELS[locale].present;
    const date = d instanceof Date ? d : new Date(d);
    return `${MONTHS[locale][date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function dateRange(
    start: Date | undefined,
    end: Date | undefined,
    locale: Locale
): string {
    if (!start) return '';
    return `${fmtMonth(start, locale)} - ${fmtMonth(end, locale)}`;
}

const e = escapeLatex;

function renderHeader(data: CvData): string {
    const { header } = data;
    const parts: string[] = [];
    if (header.phone) {
        const tel = header.phone.replace(/[^+\d]/g, '');
        parts.push(`\\href{tel:${tel}}{${e(header.phone)}}`);
    }
    for (const c of header.contacts) {
        parts.push(c.url ? `\\href{${e(c.url)}}{${e(c.label)}}` : e(c.label));
    }
    const contacts = parts.join(' \\quad ');

    return [
        `{\\Huge\\bfseries ${e(header.name)}}\\\\[2pt]`,
        header.profession ? `{\\large ${e(header.profession)}}\\\\[4pt]` : '',
        contacts ? `{\\small ${contacts}}` : '',
        header.summary ? `\\\\[6pt]\\noindent ${e(header.summary)}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}

function renderExperience(data: CvData): string {
    if (!data.experiences.length) return '';
    const blocks = data.experiences
        .map(exp => {
            const head = [
                `\\textbf{${e(exp.company)}}`,
                exp.location ? e(exp.location) : '',
                exp.contract ? `\\textit{${e(exp.contract)}}` : '',
            ]
                .filter(Boolean)
                .join(' \\textbar{} ');
            const range = dateRange(exp.startDate, exp.endDate, data.locale);
            const roles = exp.roles.length
                ? `\\textit{${exp.roles.map(e).join(' / ')}}\\\\`
                : '';

            const missions = exp.missions
                .map(m => {
                    const mHead = [
                        `\\textbf{${e(m.title)}}`,
                        m.client ? e(m.client) : '',
                    ]
                        .filter(Boolean)
                        .join(' \\textbar{} ');
                    const mRange = dateRange(
                        m.startDate,
                        m.endDate,
                        data.locale
                    );
                    const ctx = m.context ? `${e(m.context)}\\\\` : '';
                    const bullets = m.bullets.length
                        ? `\\begin{itemize}[leftmargin=1.2em,nosep,topsep=2pt]\n${m.bullets
                              .map(b => `  \\item ${e(b)}`)
                              .join('\n')}\n\\end{itemize}`
                        : '';
                    return [
                        `\\smallskip`,
                        `\\noindent ${mHead}\\hfill ${mRange}\\\\`,
                        ctx,
                        bullets,
                    ]
                        .filter(Boolean)
                        .join('\n');
                })
                .join('\n');

            return [
                `\\noindent ${head}\\hfill ${range}\\\\`,
                roles,
                missions,
            ]
                .filter(Boolean)
                .join('\n');
        })
        .join('\n\\medskip\n');

    return `\\section*{${LABELS[data.locale].experience}}\n${blocks}`;
}

function renderEducation(data: CvData): string {
    if (!data.education.length) return '';
    const blocks = data.education
        .map(ed => {
            const head = `\\textbf{${e(ed.degree)}} \\textbar{} ${e(
                ed.institution
            )}`;
            const range = dateRange(ed.startDate, ed.endDate, data.locale);
            const desc = ed.description ? `\\\\${e(ed.description)}` : '';
            return `\\noindent ${head}\\hfill ${range}${desc}`;
        })
        .join('\n\\smallskip\n');
    return `\\section*{${LABELS[data.locale].education}}\n${blocks}`;
}

function renderSkills(data: CvData): string {
    if (!data.skillGroups.length && !data.spokenLanguages) return '';
    const rows = data.skillGroups
        .map(
            g =>
                `\\noindent\\textbf{${e(g.category)}:} ${g.skills
                    .map(e)
                    .join(', ')}\\\\`
        );
    if (data.spokenLanguages) {
        rows.push(
            `\\noindent\\textbf{${LABELS[data.locale].spoken}:} ${e(
                data.spokenLanguages
            )}\\\\`
        );
    }
    return `\\section*{${LABELS[data.locale].skills}}\n${rows.join('\n')}`;
}

function renderProjects(data: CvData): string {
    if (!data.projects.length) return '';
    const items = data.projects
        .map(p => {
            const name = p.url
                ? `\\href{${e(p.url)}}{\\textbf{${e(p.name)}}}`
                : `\\textbf{${e(p.name)}}`;
            const head = p.role ? `${name} - \\emph{${e(p.role)}}` : name;
            // Operator bullets win; else the portfolio description on one line.
            if (p.bullets?.length) {
                const sub = p.bullets
                    .map(b => `    \\item ${e(b)}`)
                    .join('\n');
                return `  \\item ${head}\n  \\begin{itemize}[leftmargin=1.2em,nosep,topsep=1pt]\n${sub}\n  \\end{itemize}`;
            }
            return `  \\item ${head} - ${e(p.description)}`;
        })
        .join('\n');
    const noteText = data.projectsNote
        ? data.projectsNoteUrl
            ? `\\href{${e(data.projectsNoteUrl)}}{${e(data.projectsNote)}}`
            : e(data.projectsNote)
        : '';
    const note = noteText ? `\n\\noindent\\hfill\\textit{${noteText}}` : '';
    return `\\section*{${LABELS[data.locale].projects}}\n\\begin{itemize}[leftmargin=1.2em,nosep,topsep=2pt]\n${items}\n\\end{itemize}${note}`;
}

function renderActivities(data: CvData): string {
    if (!data.activities.length) return '';
    const blocks = data.activities
        .map(a => {
            const head = [
                `\\textbf{${e(a.org)}}`,
                a.role ? e(a.role) : '',
                a.dates ? e(a.dates) : '',
            ]
                .filter(Boolean)
                .join(' \\textbar{} ');
            const bullets = a.bullets.length
                ? `\\begin{itemize}[leftmargin=1.2em,nosep,topsep=2pt]\n${a.bullets
                      .map(b => `  \\item ${e(b)}`)
                      .join('\n')}\n\\end{itemize}`
                : '';
            return `\\noindent ${head}\\\\\n${bullets}`;
        })
        .join('\n\\smallskip\n');
    return `\\section*{${LABELS[data.locale].activities}}\n${blocks}`;
}

/**
 * Render the full `.tex` document for the given CV data.
 * @param data locale-resolved, selection-filtered CV content
 * @returns a complete LaTeX source string ready for Tectonic
 */
export function renderInternational(data: CvData): string {
    const body = [
        renderHeader(data),
        renderExperience(data),
        renderEducation(data),
        renderSkills(data),
        renderProjects(data),
        renderActivities(data),
    ]
        .filter(Boolean)
        .join('\n\n\\bigskip\n\n');

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.7cm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\usepackage{parskip}

\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0pt}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}
${body}
\\end{document}
`;
}
