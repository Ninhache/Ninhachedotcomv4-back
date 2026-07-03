/**
 * Escape a raw string so it is safe to interpolate into a LaTeX document.
 *
 * Every value pulled from the database is user-authored content that may
 * contain characters LaTeX treats as syntax (`& % $ # _ { } ~ ^ \`). Left
 * unescaped these either break compilation or, worse, let stored content inject
 * arbitrary TeX. All DB-sourced text MUST pass through here before being placed
 * in a template.
 *
 * The replacement runs in a single pass (one regex with a replacer) so the
 * braces/backslashes introduced by `\textbackslash{}` etc. are not themselves
 * re-escaped.
 *
 * @param input raw text (null/undefined collapse to an empty string)
 * @returns the LaTeX-safe equivalent
 */
const REPLACEMENTS: Record<string, string> = {
    '\\': '\\textbackslash{}',
    '{': '\\{',
    '}': '\\}',
    '&': '\\&',
    '%': '\\%',
    $: '\\$',
    '#': '\\#',
    _: '\\_',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
};

export function escapeLatex(input: string | null | undefined): string {
    if (input == null) return '';
    return input.replace(/[\\{}&%$#_~^]/g, ch => REPLACEMENTS[ch]);
}
