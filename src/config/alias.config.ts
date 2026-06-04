import { registerAs } from '@nestjs/config';

/** Defaults for the alias sandbox engine (see B2). */
const DEFAULT_EVAL_TIMEOUT_MS = 50;
const DEFAULT_EVAL_MAX_DEPTH = 20;

/**
 * Alias evaluation tuning. `evalTimeoutMs` bounds each isolate execution;
 * `evalMaxDepth` is the anti-cycle / composition depth guard.
 */
export default registerAs('alias', () => ({
    evalTimeoutMs: Number.parseInt(
        process.env.ALIAS_EVAL_TIMEOUT_MS ?? String(DEFAULT_EVAL_TIMEOUT_MS),
        10
    ),
    evalMaxDepth: Number.parseInt(
        process.env.ALIAS_EVAL_MAX_DEPTH ?? String(DEFAULT_EVAL_MAX_DEPTH),
        10
    ),
}));
