export const ENVIRONMENT = ['develop', 'production'] as const;

export type ENVIRONMENT_TYPE = (typeof ENVIRONMENT)[number];
