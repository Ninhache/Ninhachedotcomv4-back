import { Locale } from '@prisma/client';

/**
 * Locale-resolved, CV-shaped view of the portfolio content. `CvService.gatherData`
 * produces this from the DB (translations already collapsed to a single locale,
 * entries already filtered by the admin's selection and `isVisible`), and the
 * LaTeX templates consume it. Strings here are RAW — the template is responsible
 * for `escapeLatex()`-ing them.
 */
export interface CvData {
    locale: Locale;
    header: CvHeader;
    experiences: CvExperience[];
    education: CvEducation[];
    skillGroups: CvSkillGroup[];
    /** Operator-written spoken-languages line (e.g. "French (native), English
     *  (professional — TOEIC 900)") — no portfolio entity backs it. */
    spokenLanguages?: string;
    projects: CvProject[];
    /** Optional one-line note shown under the Projects section
     *  (e.g. "More projects on github.com/Ninhache"). */
    projectsNote?: string;
    /** Optional URL making `projectsNote` a clickable link. */
    projectsNoteUrl?: string;
    activities: CvActivity[];
    references: CvReference[];
    /** Optional note for the References section (e.g. "available upon request"). */
    referencesNote?: string;
}

export interface CvHeader {
    name: string;
    profession: string;
    summary: string;
    /** Plain-text phone shown first in the header (optional). */
    phone?: string;
    /** GitHub / LinkedIn / email … flattened from Contact rows. */
    contacts: CvContact[];
}

export interface CvContact {
    label: string;
    url: string;
}

/** One employer, with the role title(s) held there and the missions delivered. */
export interface CvExperience {
    company: string;
    location?: string;
    /** e.g. "Apprenticeship", "Internship" — derived from ContractType. */
    contract?: string;
    startDate?: Date;
    endDate?: Date; // undefined => ongoing
    /** Job-title progression (Position rows), most recent first. */
    roles: string[];
    missions: CvMission[];
}

export interface CvMission {
    title: string;
    client?: string;
    context?: string;
    startDate: Date;
    endDate?: Date; // undefined => ongoing
    /** Ordered bullet points (MissionTranslation.tasks). */
    bullets: string[];
}

export interface CvEducation {
    institution: string;
    degree: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
}

/** Skills grouped by their SkillCategory for a tidy CV "Skills" section. */
export interface CvSkillGroup {
    category: string;
    skills: string[];
}

export interface CvProject {
    name: string;
    description: string;
    url?: string;
    startDate?: Date;
    endDate?: Date;
    /** Operator-written role line (e.g. "Founder & lead developer"). */
    role?: string;
    /** Operator-written achievement bullets; when present, shown instead of
     *  (or alongside) the description. */
    bullets?: string[];
}

/** A "Leadership & Activities" entry (e.g. ESN membership). Operator-authored
 *  in the config — there is no portfolio entity behind it. */
export interface CvActivity {
    org: string;
    role?: string;
    dates?: string;
    bullets: string[];
}

/** A named reference (operator-authored). */
export interface CvReference {
    name: string;
    title?: string;
    org?: string;
    contact?: string;
    url?: string;
}
