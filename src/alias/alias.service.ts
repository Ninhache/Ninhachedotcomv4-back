import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { MARKER_RE, parseArgs } from './alias.parser';
import { resolveFeeds } from './feeds';
import { runBody } from './sandbox';

/** Locale used as a fallback when an alias has no body for the requested one. */
const DEFAULT_LOCALE = 'fr';

type Definitions = Map<string, Map<string, string>>; // key -> (locale -> code)

@Injectable()
export class AliasService {
    private readonly logger = new Logger(AliasService.name);
    private readonly timeoutMs: number;
    private readonly maxDepth: number;

    /** In-memory cache of alias definitions; invalidated on any alias mutation. */
    private definitions: Definitions | null = null;

    /**
     * TEST-ONLY clock override (ms). When set, the sandbox `Date` is frozen to
     * this instant so age/greeting bodies are deterministic. Never set in prod.
     */
    clockOverrideMs?: number;

    constructor(
        private readonly prisma: PrismaService,
        config: ConfigService
    ) {
        this.timeoutMs = config.get<number>('alias.evalTimeoutMs') ?? 50;
        this.maxDepth = config.get<number>('alias.evalMaxDepth') ?? 20;
    }

    /** Drop the cached definitions so the next resolution reloads from DB. */
    invalidate(): void {
        this.definitions = null;
    }

    private async ensureLoaded(): Promise<Definitions> {
        if (this.definitions) return this.definitions;
        const aliases = await this.prisma.alias.findMany({
            include: { bodies: true },
        });
        const defs: Definitions = new Map();
        for (const alias of aliases) {
            const byLocale = new Map<string, string>();
            for (const body of alias.bodies) byLocale.set(body.locale, body.code);
            defs.set(alias.key, byLocale);
        }
        this.definitions = defs;
        return defs;
    }

    private hasAlias(key: string): boolean {
        return this.definitions?.has(key) ?? false;
    }

    private getBody(key: string, locale: string): string | undefined {
        const byLocale = this.definitions?.get(key);
        if (!byLocale) return undefined;
        return byLocale.get(locale) ?? byLocale.get(DEFAULT_LOCALE);
    }

    /**
     * Resolves one alias to its (string) value. Synchronous: feeds and
     * definitions are pre-loaded by the public async entrypoints, so the whole
     * composition chain — including nested `$.alias` access — runs without I/O.
     *
     * Memoised per `key|locale|args`. A cycle (key already on the stack) or a
     * depth-guard breach logs and returns '' instead of recursing forever; any
     * eval error/timeout logs and returns '' too. It never throws.
     */
    private resolveAlias(
        key: string,
        locale: string,
        args: string[],
        stack: string[],
        memo: Map<string, string>,
        feeds: Record<string, unknown>,
        depth: number
    ): string {
        const memoKey = `${key}|${locale}|${args.join(',')}`;
        const cached = memo.get(memoKey);
        if (cached !== undefined) return cached;

        if (depth > this.maxDepth) {
            this.logger.error(
                `alias depth limit (${this.maxDepth}) exceeded at '${key}'`
            );
            return '';
        }
        if (stack.includes(key)) {
            this.logger.error(
                `alias cycle detected: ${[...stack, key].join(' -> ')}`
            );
            return '';
        }

        const code = this.getBody(key, locale);
        if (code === undefined) {
            this.logger.warn(`no body for alias '${key}' (locale '${locale}')`);
            return '';
        }

        let result: string;
        try {
            result = runBody({
                code,
                data: { args, ...feeds },
                resolveAlias: (nestedKey: string) =>
                    this.resolveAlias(
                        nestedKey,
                        locale,
                        [],
                        [...stack, key],
                        memo,
                        feeds,
                        depth + 1
                    ),
                timeoutMs: this.timeoutMs,
                now: this.clockOverrideMs,
            });
        } catch (e) {
            this.logger.error(
                `alias '${key}' eval failed: ${
                    e instanceof Error ? e.message : String(e)
                }`
            );
            result = '';
        }

        memo.set(memoKey, result);
        return result;
    }

    /** Synchronous interpolation pass over one string (feeds/defs pre-resolved). */
    private resolveTextSync(
        text: string,
        locale: string,
        feeds: Record<string, unknown>,
        memo: Map<string, string>
    ): string {
        return text.replace(MARKER_RE, (match, key?: string, rawArgs?: string) => {
            if (match === '@@@@') return '@@';
            if (!key || !this.hasAlias(key)) {
                this.logger.warn(`unknown alias '@@${key}' left raw`);
                return match;
            }
            return this.resolveAlias(
                key,
                locale,
                parseArgs(rawArgs),
                [],
                memo,
                feeds,
                0
            );
        });
    }

    /** Resolves every `@@marker` in a single string for the given locale. */
    async resolveText(text: string, locale: string): Promise<string> {
        if (!text) return text;
        await this.ensureLoaded();
        const feeds = await resolveFeeds(this.prisma);
        return this.resolveTextSync(text, locale, feeds, new Map());
    }

    /**
     * Deep-resolves string fields of an object/array. Without `fields`, every
     * string anywhere in the structure is scanned (cheap: strings without
     * markers pass through, and literal `@@` still gets unescaped). With
     * `fields`, only string properties whose key is listed are resolved.
     *
     * `locale` is the default. Because content payloads carry *all* locales'
     * translations at once, any subtree that declares its own string `locale`
     * field (e.g. a translation row) is resolved in *that* locale instead — so
     * `@@greeting` in the `en` translation uses the English body even when the
     * request's default locale is `fr`.
     */
    async resolveObject<T>(
        obj: T,
        locale: string,
        fields?: string[]
    ): Promise<T> {
        await this.ensureLoaded();
        const feeds = await resolveFeeds(this.prisma);
        const memo = new Map<string, string>();

        const walk = (
            value: unknown,
            activeLocale: string,
            key?: string
        ): unknown => {
            if (typeof value === 'string') {
                if (!fields || (key !== undefined && fields.includes(key))) {
                    return this.resolveTextSync(
                        value,
                        activeLocale,
                        feeds,
                        memo
                    );
                }
                return value;
            }
            if (Array.isArray(value)) {
                return value.map(item => walk(item, activeLocale, key));
            }
            if (value && typeof value === 'object') {
                // Only descend into plain objects. Date (and other class
                // instances) are leaves — recursing would turn `date: Date`
                // into `{}` and corrupt the response.
                const proto = Object.getPrototypeOf(value);
                if (proto !== Object.prototype && proto !== null) {
                    return value;
                }
                const record = value as Record<string, unknown>;
                // A subtree that declares its own locale resolves in it.
                const subtreeLocale =
                    typeof record.locale === 'string'
                        ? record.locale
                        : activeLocale;
                const out: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(record)) {
                    out[k] = walk(v, subtreeLocale, k);
                }
                return out;
            }
            return value;
        };

        return walk(obj, locale) as T;
    }
}
