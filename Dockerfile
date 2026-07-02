# Étape de build
FROM node:lts as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape finale (production)
# Debian *trixie* (not bookworm): the upstream Tectonic binary requires GLIBC
# 2.38/2.39, and bookworm only ships 2.36. trixie ships 2.41. Tag stays on the
# Node LTS line so the ABI matches the builder stage (both Node 24).
FROM node:lts-trixie-slim

WORKDIR /app

# ffmpeg: used to remux uploaded MP4/MOV with +faststart (see MediaService).
# Tectonic (CV generator, POST /cv/generate) runtime deps:
#   - curl/ca-certificates: fetch the binary + the LaTeX package bundle (https)
#   - fontconfig: font handling
#   - libgraphite2-3: the only shared lib the prebuilt binary still needs that
#     isn't already in the base image (verified via ldd)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg curl ca-certificates fontconfig libgraphite2-3 \
    && rm -rf /var/lib/apt/lists/*

# Tectonic: install the upstream prebuilt binary (not in Debian's repo). The
# drop-in script unpacks `tectonic` into the cwd; move it onto PATH.
RUN curl -fsSL https://drop-sh.fullyjustified.net | sh \
    && mv tectonic /usr/local/bin/tectonic \
    && tectonic --version

# Pre-warm the package cache at build time (network is available here) so the
# first real generation in production doesn't need to reach a CTAN mirror. Load
# the same packages the template uses.
# NB: cache lives OUTSIDE /app so the dev compose bind-mount (.:/app) can't
# shadow it.
ENV TECTONIC_CACHE_DIR=/var/cache/tectonic
RUN mkdir -p /var/cache/tectonic \
    && printf '%s\n' \
        '\documentclass[letterpaper,11pt]{article}' \
        '\usepackage[margin=1.7cm]{geometry}' \
        '\usepackage{latexsym}' \
        '\usepackage[empty]{fullpage}' \
        '\usepackage{enumitem}' \
        '\usepackage{titlesec}' \
        '\usepackage{marvosym}' \
        '\usepackage[usenames,dvipsnames]{color}' \
        '\usepackage{verbatim}' \
        '\usepackage[hidelinks]{hyperref}' \
        '\usepackage{fancyhdr}' \
        '\usepackage[english]{babel}' \
        '\usepackage{tabularx}' \
        '\usepackage{parskip}' \
        '\begin{document}warmup\end{document}' > /tmp/warm.tex \
    && tectonic /tmp/warm.tex --outdir /tmp \
    && rm -f /tmp/warm.tex /tmp/warm.pdf

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads

ENV NODE_ENV=production

CMD ["node", "dist/main"]

