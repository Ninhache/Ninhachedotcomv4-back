import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/** Thrown when Tectonic exits non-zero; carries its log for the admin UI. */
export class LatexCompileError extends Error {
    constructor(
        message: string,
        public readonly log: string
    ) {
        super(message);
        this.name = 'LatexCompileError';
    }
}

const TECTONIC_BIN = process.env.TECTONIC_BIN ?? 'tectonic';
const COMPILE_TIMEOUT_MS = Number(process.env.CV_COMPILE_TIMEOUT_MS ?? 60_000);

/**
 * Compile a LaTeX source string to a PDF using Tectonic.
 *
 * Runs in an isolated temp directory that is always cleaned up. On the first
 * ever run Tectonic fetches the packages it needs from the network (see the
 * Docker cache-warming note), so allow a generous timeout.
 *
 * @param tex full `.tex` document source
 * @returns the compiled PDF as a Buffer
 * @throws {LatexCompileError} when Tectonic fails — `.log` holds stdout+stderr
 */
export async function compileLatex(tex: string): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'cv-'));
    const texPath = join(dir, 'cv.tex');
    const pdfPath = join(dir, 'cv.pdf');

    try {
        await writeFile(texPath, tex, 'utf8');

        const log = await new Promise<string>((resolve, reject) => {
            const child = spawn(
                TECTONIC_BIN,
                ['cv.tex', '--outdir', dir, '--chatter', 'minimal'],
                { cwd: dir, timeout: COMPILE_TIMEOUT_MS }
            );

            let out = '';
            child.stdout?.on('data', d => (out += d.toString()));
            child.stderr?.on('data', d => (out += d.toString()));

            child.on('error', err =>
                reject(
                    new LatexCompileError(
                        `Failed to launch Tectonic ("${TECTONIC_BIN}"): ${err.message}. Is it installed?`,
                        out
                    )
                )
            );
            child.on('close', (code, signal) => {
                if (code === 0) return resolve(out);
                reject(
                    new LatexCompileError(
                        signal
                            ? `Tectonic killed by signal ${signal} (timeout?)`
                            : `Tectonic exited with code ${code}`,
                        out
                    )
                );
            });
        });

        try {
            return await readFile(pdfPath);
        } catch {
            throw new LatexCompileError(
                'Tectonic reported success but produced no PDF',
                log
            );
        }
    } finally {
        // Best-effort cleanup; a leaked temp dir must never fail a request.
        await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

/** Suggest a unique uploaded filename for a generated CV PDF. */
export function generatedPdfFilename(): string {
    return `${randomUUID()}.pdf`;
}
