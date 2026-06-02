import { SetMetadata } from '@nestjs/common';

export const REVALIDATE_META = 'revalidate:content';

export interface RevalidateMeta {
    /** Base cache tag, e.g. 'projects' — expanded to `<entity>` + `<entity>:<locale>`. */
    entity: string;
    /** Also invalidate the locale-agnostic 'greeting' tag (home/hero content). */
    greeting?: boolean;
}

/**
 * Marks a content controller so that any successful non-GET request triggers a
 * front-end revalidation of `<entity>`, `<entity>:fr`, `<entity>:en`
 * (+ 'greeting' when set). See RevalidationInterceptor.
 */
export const RevalidateContent = (
    entity: string,
    opts?: { greeting?: boolean }
) =>
    SetMetadata<string, RevalidateMeta>(REVALIDATE_META, {
        entity,
        greeting: opts?.greeting ?? false,
    });
