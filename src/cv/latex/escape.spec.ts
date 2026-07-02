import { escapeLatex } from './escape';

describe('escapeLatex', () => {
    it('returns an empty string for null/undefined', () => {
        expect(escapeLatex(null)).toBe('');
        expect(escapeLatex(undefined)).toBe('');
    });

    it('leaves plain text untouched', () => {
        expect(escapeLatex('Hello World 123')).toBe('Hello World 123');
    });

    it.each([
        ['&', '\\&'],
        ['%', '\\%'],
        ['$', '\\$'],
        ['#', '\\#'],
        ['_', '\\_'],
        ['{', '\\{'],
        ['}', '\\}'],
        ['~', '\\textasciitilde{}'],
        ['^', '\\textasciicircum{}'],
        ['\\', '\\textbackslash{}'],
    ])('escapes %s', (input, expected) => {
        expect(escapeLatex(input)).toBe(expected);
    });

    it('escapes in a single pass (braces from \\ are not re-escaped)', () => {
        // If it ran multiple passes, the braces introduced by \textbackslash{}
        // would themselves become \{ \}.
        expect(escapeLatex('\\')).toBe('\\textbackslash{}');
    });

    it('handles realistic CV content with mixed specials', () => {
        expect(escapeLatex('Reduced cost by 50% & saved $5_000')).toBe(
            'Reduced cost by 50\\% \\& saved \\$5\\_000'
        );
    });
});
