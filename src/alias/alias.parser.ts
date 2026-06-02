/**
 * Content interpolation grammar.
 *
 * A marker is `@@key` or `@@key(arg1,arg2)`. `key` starts with a letter then
 * word chars. The escape `@@@@` yields a literal `@@`.
 *
 * The combined regex matches an escape OR a marker, in that order, so that
 * `@@@@key` correctly produces the literal `@@key` (the escape is consumed
 * first) rather than resolving `@@key`.
 *
 *  - group 1: marker key (undefined for an escape match)
 *  - group 2: raw args string, e.g. "a, b" (undefined when no parens)
 */
export const MARKER_RE = /@@@@|@@([a-zA-Z][\w]*)(?:\(([^)]*)\))?/g;

/** The literal a `@@@@` escape collapses to. */
export const ESCAPE = '@@@@';

/** Splits the raw args capture into trimmed args; empty/undefined -> []. */
export function parseArgs(rawArgs: string | undefined): string[] {
    if (rawArgs === undefined || rawArgs.trim() === '') return [];
    return rawArgs.split(',').map(s => s.trim());
}
