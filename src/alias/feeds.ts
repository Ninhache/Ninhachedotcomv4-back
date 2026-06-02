import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Feeds are the ONLY code-level primitive that touches the DB. Each feed is
 * resolved host-side by NestJS *before* an alias body runs and injected into
 * `$` (e.g. `$.projectCount`). The isolate never gets Prisma access.
 *
 * Adding a feed = a code change (and the only thing that needs a redeploy),
 * because it implies a DB query we deliberately keep out of the sandbox.
 */
export const feeds = {
    projectCount: async (prisma: PrismaService) =>
        // NOTE: this schema uses `isVisible` (there is no `published` column).
        prisma.project.count({ where: { isVisible: true } }),
    // latestProjectName: async (prisma) => ...
} as const;

/** Resolves every feed once and returns a plain map for injection into `$`. */
export async function resolveFeeds(
    prisma: PrismaService
): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    for (const [key, fn] of Object.entries(feeds)) {
        out[key] = await fn(prisma);
    }
    return out;
}
