import { SetMetadata } from '@nestjs/common';

export const REVALIDATE_META = 'revalidate:content';

export interface RevalidateMeta {
    /**
     * Base cache tag(s), e.g. 'projects' — each is expanded to `<entity>` +
     * `<entity>:<locale>`. Pass an array when a mutation affects several cached
     * surfaces (e.g. editing a tag, which appears in projects/skills/experiences).
     */
    entity: string | string[];
    /** Also invalidate the locale-agnostic 'greeting' tag (home/hero content). */
    greeting?: boolean;
}

/**
 * Marks a content controller so that any successful non-GET request triggers a
 * front-end revalidation of `<entity>`, `<entity>:fr`, `<entity>:en`
 * (+ 'greeting' when set). `entity` may be an array to invalidate several cache
 * tags at once. See RevalidationInterceptor.
 */
export const RevalidateContent = (
    entity: string | string[],
    opts?: { greeting?: boolean }
) =>
    SetMetadata<string, RevalidateMeta>(REVALIDATE_META, {
        entity,
        greeting: opts?.greeting ?? false,
    });
