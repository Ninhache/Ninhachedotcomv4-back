import * as ivm from 'isolated-vm';

/**
 * Executes a single alias body inside an isolated-vm isolate.
 *
 * The isolate has NO access to `process`, `require`, fs or the network — only
 * the JS builtins (Date, Math, Intl, JSON). The body is wrapped as
 * `function __run($) { <code> }` and its return value is coerced to a string.
 *
 * The host exposes exactly two things to the body, both through `$`:
 *  - own properties of `data` (`$.args`, `$.<feed>`) — pre-resolved by the host
 *  - any other `$.<key>` access -> synchronous host callback `resolveAlias(key)`
 *    used for lazy alias composition (cycle handling lives in the caller).
 *
 * Anything that throws/loops is bounded by `timeoutMs`; the caller turns a
 * thrown timeout into a fallback so a bad body never crashes a request.
 *
 * `now` is a test seam: when provided, `Date.now()` / `new Date()` are frozen
 * to that instant inside the isolate (the isolate has its own clock, immune to
 * host fake-timers). In production it is omitted and the real clock is used.
 */
export function runBody(params: {
    code: string;
    data: Record<string, unknown>;
    resolveAlias: (key: string) => string;
    timeoutMs: number;
    now?: number;
}): string {
    const isolate = new ivm.Isolate({ memoryLimit: 16 });
    try {
        const context = isolate.createContextSync();
        const jail = context.global;

        // Host bridge for lazy resolution of other aliases.
        jail.setSync(
            '__resolve',
            new ivm.Reference((key: string) =>
                params.resolveAlias(String(key))
            )
        );
        // Own data ($.args, $.projectCount, ...).
        jail.setSync('__data', new ivm.ExternalCopy(params.data).copyInto());
        // Optional frozen clock (number) or undefined for the real clock.
        jail.setSync('__now', typeof params.now === 'number' ? params.now : undefined);

        context.evalSync(`
            if (typeof __now === 'number') {
                const RealDate = Date;
                const Frozen = function (...args) {
                    return args.length === 0 ? new RealDate(__now) : new RealDate(...args);
                };
                Frozen.now = function () { return __now; };
                Frozen.prototype = RealDate.prototype;
                Frozen.UTC = RealDate.UTC;
                Frozen.parse = RealDate.parse;
                globalThis.Date = Frozen;
            }
            globalThis.$ = new Proxy(__data, {
                get(target, k) {
                    if (typeof k === 'symbol') return undefined;
                    if (k in target) return target[k];
                    return __resolve.applySync(undefined, [String(k)], {
                        arguments: { copy: true },
                        result: { copy: true },
                    });
                },
            });
            globalThis.__run = function ($) { ${params.code} };
        `);

        return context.evalSync('String(__run($))', {
            timeout: params.timeoutMs,
        });
    } finally {
        isolate.dispose();
    }
}
