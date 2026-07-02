import { CvData } from '../../entities/cv-data';
import { renderCern } from './cern';
import { renderInternational } from './international';

/**
 * Registry of available CV templates. The `CvConfig.template` key selects one.
 * To add the author's own design, drop a sibling module exporting a
 * `(data: CvData) => string` renderer and register it here (e.g. "france").
 */
export const TEMPLATES: Record<string, (data: CvData) => string> = {
    international: renderInternational,
    cern: renderCern,
};

export const DEFAULT_TEMPLATE = 'international';

export function getTemplate(key: string | undefined): (data: CvData) => string {
    return TEMPLATES[key ?? DEFAULT_TEMPLATE] ?? TEMPLATES[DEFAULT_TEMPLATE];
}
