import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

/** Per-locale override of a set of CV bullet points (mission or project). */
export type CvMissionBullets = { fr?: string[]; en?: string[] };

/** An extra header link not backed by a Contact row (e.g. the portfolio). */
export class CvLinkDto {
    @IsString() @IsNotEmpty() label: string;
    @IsString() @IsNotEmpty() url: string;
}

/** A named reference (operator-authored). `url` makes `contact` a link. */
export class CvReferenceDto {
    @IsString() @IsNotEmpty() name: string;
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsString() org?: string;
    @IsOptional() @IsString() contact?: string;
    @IsOptional() @IsString() url?: string;
}

/** Per-locale string (role line, etc.). */
export class CvLocaleStringDto {
    @IsOptional() @IsString() fr?: string;
    @IsOptional() @IsString() en?: string;
}

/** Per-locale arrays of bullet strings. */
export class CvLocaleBulletsDto {
    @IsOptional() @IsArray() @IsString({ each: true }) fr?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) en?: string[];
}

/**
 * One "Leadership & Activities" entry (e.g. ESN membership). Operator-authored
 * in the config — there is no portfolio entity behind it. `org`/`dates` are
 * locale-independent; `role`/`bullets` are per-locale.
 */
export class CvActivityDto {
    @IsString() @IsNotEmpty() org: string;
    @IsOptional() @IsString() dates?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CvLocaleStringDto)
    role?: CvLocaleStringDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CvLocaleBulletsDto)
    bullets?: CvLocaleBulletsDto;
}

/** Which top-level sections to render. Absent flag => included by default. */
export class CvSectionsDto {
    @IsOptional() @IsBoolean() experience?: boolean;
    @IsOptional() @IsBoolean() education?: boolean;
    @IsOptional() @IsBoolean() skills?: boolean;
    @IsOptional() @IsBoolean() projects?: boolean;
    @IsOptional() @IsBoolean() contact?: boolean;
}

/**
 * Per-entity allow-lists of ids to include. When a list is `undefined` the
 * generator includes every visible row of that entity; when it is present
 * (even empty) only the listed ids are kept. This is the "choose what to show"
 * lever, independent from the public-site `isVisible` flag.
 */
export class CvIncludeIdsDto {
    @IsOptional() @IsArray() @IsString({ each: true }) companies?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) missions?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) education?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) projects?: string[];
    @IsOptional() @IsArray() @IsString({ each: true }) contacts?: string[];
}

/**
 * Per-locale professional summary shown at the top of the CV. Kept separate
 * from the portfolio `Profile.description` on purpose: that copy is catchy /
 * concise for the website, not a recruiter-facing résumé summary. Left empty =>
 * the template omits the summary line.
 */
export class CvSummaryDto {
    @IsOptional() @IsString() fr?: string;
    @IsOptional() @IsString() en?: string;
}

export class CvSelectionDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => CvSectionsDto)
    sections?: CvSectionsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CvIncludeIdsDto)
    includeIds?: CvIncludeIdsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CvSummaryDto)
    summary?: CvSummaryDto;

    /** Phone number shown first in the header (plain text — not in the DB). */
    @IsOptional()
    @IsString()
    phone?: string;

    /** Operator-written spoken-languages line, per locale (the data model has
     *  no spoken-languages entity). */
    @IsOptional()
    @ValidateNested()
    @Type(() => CvLocaleStringDto)
    spokenLanguages?: CvLocaleStringDto;

    /** Optional one-line note under the Projects section, per locale. */
    @IsOptional()
    @ValidateNested()
    @Type(() => CvLocaleStringDto)
    projectsNote?: CvLocaleStringDto;

    /** Optional URL making the projects note a clickable link. */
    @IsOptional()
    @IsString()
    projectsNoteUrl?: string;

    /**
     * Per-mission CV bullet overrides, keyed by mission id. When present (and
     * non-empty for the rendered locale), these replace the portfolio
     * `Mission.tasks` — the portfolio tasks are duty-phrased, whereas a US CV
     * wants achievement/impact/problem-solving bullets. Validated loosely
     * (`@IsObject`) because the keys are dynamic mission ids; the service
     * defensively coerces values to string[].
     */
    @IsOptional()
    @IsObject()
    bulletsByMission?: Record<string, CvMissionBullets>;

    /** Per-project achievement-bullet overrides, keyed by project id. Same
     *  semantics as `bulletsByMission` (replaces the project description when
     *  non-empty for the locale). */
    @IsOptional()
    @IsObject()
    bulletsByProject?: Record<string, CvMissionBullets>;

    /** Per-project role line (e.g. "Founder & lead developer"), keyed by
     *  project id, per locale. */
    @IsOptional()
    @IsObject()
    roleByProject?: Record<string, { fr?: string; en?: string }>;

    /** Operator-authored "Leadership & Activities" entries (e.g. ESN). */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CvActivityDto)
    activities?: CvActivityDto[];

    /** Named references (rendered in a "References" section). */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CvReferenceDto)
    references?: CvReferenceDto[];

    /** Per-locale note for the References section (e.g. "available upon
     *  request"), shown with or instead of named references. */
    @IsOptional()
    @ValidateNested()
    @Type(() => CvLocaleStringDto)
    referencesNote?: CvLocaleStringDto;

    /** Extra header links appended after the selected Contact rows (e.g. the
     *  portfolio site) — not backed by a Contact entity. Order is preserved. */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CvLinkDto)
    extraLinks?: CvLinkDto[];
}
