import { Locale } from '@prisma/client';
import { CvData, CvExperience } from '../../entities/cv-data';
import { escapeLatex } from '../escape';

/**
 * "Jake's Resume" layout (MIT) adapted for the XeTeX engine that Tectonic ships
 * with. The upstream template targets pdfLaTeX and uses pdfTeX-only primitives
 * (`\input{glyphtounicode}`, `\pdfgentounicode=1`, `\usepackage[T1]{fontenc}`)
 * that ERROR under XeTeX — they are removed here. XeTeX is Unicode-native, so
 * accents render and the PDF text layer stays ATS-extractable without them.
 *
 * Single column, ATS-safe. Sections: Experience -> Projects -> Technical Skills
 * -> Education -> Leadership & Activities (results-before-diplomas ordering).
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

const PRESENT: Record<Locale, string> = { fr: "Aujourd'hui", en: 'Present' };
const SECTION: Record<Locale, Record<string, string>> = {
    fr: {
        experience: 'Expérience',
        projects: 'Projets sélectionnés',
        skills: 'Compétences',
        education: 'Formation',
        activities: 'Engagements \\& Activités',
        references: 'Références',
        spoken: 'Langues',
    },
    en: {
        experience: 'Experience',
        projects: 'Selected Projects',
        skills: 'Technical Skills',
        education: 'Education',
        activities: 'Leadership \\& Activities',
        references: 'References',
        spoken: 'Spoken',
    },
};

const e = escapeLatex;

function fmtMonth(d: Date | undefined, locale: Locale): string {
    if (!d) return PRESENT[locale];
    const date = d instanceof Date ? d : new Date(d);
    return `${MONTHS[locale][date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function range(
    start: Date | undefined,
    end: Date | undefined,
    locale: Locale
): string {
    if (!start) return '';
    return `${fmtMonth(start, locale)} - ${fmtMonth(end, locale)}`;
}

function projectDate(
    start: Date | undefined,
    end: Date | undefined,
    locale: Locale
): string {
    if (!start) return '';
    const y = (d: Date) =>
        (d instanceof Date ? d : new Date(d)).getUTCFullYear();
    const s = y(start);
    if (!end) return `${s} - ${PRESENT[locale]}`;
    const e2 = y(end);
    return s === e2 ? `${s}` : `${s} - ${e2}`;
}

// Escape, then turn a tiny **bold** markup into \textbf{} so the operator can
// emphasise results/metrics from plain payload text (no raw LaTeX needed).
function richText(s: string | null | undefined): string {
    return escapeLatex(s).replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
}

// Bullet points drop a trailing period (they are list items, not sentences).
const stripDot = (s: string) => s.replace(/\s*\.\s*$/, '');

function itemList(bullets: string[]): string {
    if (!bullets.length) return '';
    return [
        '      \\resumeItemListStart',
        ...bullets.map(b => `        \\resumeItem{${richText(stripDot(b))}}`),
        '      \\resumeItemListEnd',
    ].join('\n');
}

function renderHeader(data: CvData): string {
    const { header } = data;
    const parts: string[] = [];
    if (header.phone) {
        const tel = header.phone.replace(/[^+\d]/g, '');
        parts.push(`\\href{tel:${tel}}{\\underline{${e(header.phone)}}}`);
    }
    for (const c of header.contacts) {
        parts.push(
            c.url
                ? `\\href{${e(c.url)}}{\\underline{${e(c.label)}}}`
                : e(c.label)
        );
    }
    const contacts = parts.join(' $|$ ');
    const summary = header.summary
        ? `\n\\small{${richText(header.summary)}}\n`
        : '';
    return `\\begin{center}
    \\textbf{\\Huge \\scshape ${e(header.name)}} \\\\ \\vspace{1pt}
    \\small ${contacts}
\\end{center}
${summary}`;
}

function experienceItems(exp: CvExperience): string {
    // Flatten the selected missions' bullets under the employer heading
    // (Jake style: a role block with achievement bullets, no per-mission
    // sub-headers). The operator curates which missions + their bullets.
    const bullets = exp.missions.flatMap(m => m.bullets);
    return itemList(bullets);
}

function renderExperience(data: CvData): string {
    if (!data.experiences.length) return '';
    const blocks = data.experiences
        .map(exp => {
            const role =
                exp.roles[0] ?? exp.missions[0]?.title ?? exp.contract ?? '';
            const subtitle = exp.contract
                ? `${exp.company} - ${exp.contract}`
                : exp.company;
            return `    \\resumeSubheading{${e(role)}}{${range(
                exp.startDate,
                exp.endDate,
                data.locale
            )}}{${e(subtitle)}}{${e(exp.location ?? '')}}
${experienceItems(exp)}`;
        })
        .join('\n    \\vspace{5pt}\n');
    return `\\section{${SECTION[data.locale].experience}}
  \\resumeSubHeadingListStart
${blocks}
  \\resumeSubHeadingListEnd`;
}

function renderProjects(data: CvData): string {
    if (!data.projects.length) return '';
    const blocks = data.projects
        .map(p => {
            // Name is the clickable link (keeps the URL); role next to it.
            const name = p.url
                ? `\\href{${e(p.url)}}{\\underline{\\textbf{${e(p.name)}}}}`
                : `\\textbf{${e(p.name)}}`;
            const heading = [name, p.role ? e(p.role) : '']
                .filter(Boolean)
                .join(' $|$ ');
            const right = projectDate(p.startDate, p.endDate, data.locale);
            // Prefer operator bullets; fall back to the portfolio description.
            const bullets = p.bullets?.length
                ? p.bullets
                : p.description
                  ? [p.description]
                  : [];
            return `      \\resumeProjectHeading{${heading}}{${right}}
${itemList(bullets)}`;
        })
        .join('\n      \\vspace{5pt}\n');
    const noteText = data.projectsNote
        ? data.projectsNoteUrl
            ? `\\href{${e(data.projectsNoteUrl)}}{\\underline{${e(
                  data.projectsNote
              )}}}`
            : e(data.projectsNote)
        : '';
    const note = noteText
        ? `\n\\vspace{2pt}\\noindent\\hfill{\\small\\textit{${noteText}}}`
        : '';
    return `\\section{${SECTION[data.locale].projects}}
    \\resumeSubHeadingListStart
${blocks}
    \\resumeSubHeadingListEnd${note}`;
}

function renderSkills(data: CvData): string {
    const lines = data.skillGroups
        .filter(g => g.skills.length)
        .map(g => `     \\textbf{${e(g.category)}}{: ${e(g.skills.join(', '))}} \\\\`);
    if (data.spokenLanguages) {
        lines.push(
            `     \\textbf{${SECTION[data.locale].spoken}}{: ${e(
                data.spokenLanguages
            )}} \\\\`
        );
    }
    if (!lines.length) return '';
    return `\\section{${SECTION[data.locale].skills}}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${lines.join('\n')}
    }}
 \\end{itemize}`;
}

function renderEducation(data: CvData): string {
    if (!data.education.length) return '';
    const blocks = data.education
        .map(ed => {
            const heading = `    \\resumeSubheading{${e(ed.institution)}}{${range(
                ed.startDate,
                ed.endDate,
                data.locale
            )}}{${e(ed.degree)}}{}`;
            // Optional coursework/description line, rendered as a list item so
            // it matches the experience blocks (was degree-only before).
            const desc = ed.description ? `\n${itemList([ed.description])}` : '';
            return `${heading}${desc}`;
        })
        .join('\n    \\vspace{5pt}\n');
    return `\\section{${SECTION[data.locale].education}}
  \\resumeSubHeadingListStart
${blocks}
  \\resumeSubHeadingListEnd`;
}

function renderActivities(data: CvData): string {
    if (!data.activities.length) return '';
    const blocks = data.activities
        .map(
            a => `    \\resumeSubheading{${e(a.role ?? a.org)}}{${e(
                a.dates ?? ''
            )}}{${e(a.role ? a.org : '')}}{}
${itemList(a.bullets)}`
        )
        .join('\n    \\vspace{5pt}\n');
    return `\\section{${SECTION[data.locale].activities}}
  \\resumeSubHeadingListStart
${blocks}
  \\resumeSubHeadingListEnd`;
}

function renderReferences(data: CvData): string {
    if (!data.references.length && !data.referencesNote) return '';
    const parts: string[] = [];
    if (data.references.length) {
        const blocks = data.references
            .map(r => {
                const right = r.contact
                    ? r.url
                        ? `\\href{${e(r.url)}}{\\underline{${e(r.contact)}}}`
                        : e(r.contact)
                    : '';
                const sub = [r.title, r.org].filter(Boolean).map(e).join(', ');
                return `    \\resumeSubheading{${e(r.name)}}{${right}}{${sub}}{}`;
            })
            .join('\n    \\vspace{5pt}\n');
        parts.push(`  \\resumeSubHeadingListStart
${blocks}
  \\resumeSubHeadingListEnd`);
    }
    if (data.referencesNote) {
        parts.push(`\\small\\textit{${richText(data.referencesNote)}}`);
    }
    return `\\section{${SECTION[data.locale].references}}
${parts.join('\n')}`;
}

/**
 * Render the full `.tex` document (Jake's Resume, XeTeX-adapted) for the CV.
 * @param data locale-resolved, selection-filtered CV content
 * @returns a complete LaTeX source string ready for Tectonic
 */
export function renderCern(data: CvData): string {
    const body = [
        renderHeader(data),
        renderExperience(data),
        renderProjects(data),
        renderSkills(data),
        renderEducation(data),
        renderActivities(data),
        renderReferences(data),
    ]
        .filter(Boolean)
        .join('\n\n');

    return `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{lastpage}
% NB: no fontspec/Ligatures=NoCommon — this host has no Latin Modern OTF for
% fontconfig, so re-setting the main font fails. We keep the engine's default
% Latin Modern and avoid ff/fi/fl-ligature words (e.g. "office") in the content.

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot[C]{\\footnotesize Page \\thepage{} of \\pageref{LastPage}}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{\\vspace{6pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-2pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

${body}

\\end{document}
`;
}
