/**
 * Parses the `?raw` query flag. When raw, content GETs return alias tokens
 * (`@@key`) unresolved — used by the admin editor so saving back doesn't freeze
 * a token into its computed value. Public reads omit it and get resolved text.
 */
export const isRaw = (raw?: string): boolean => raw === 'true' || raw === '1';
