# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Backend + admin API for the `ninhache.com` V4 portfolio (NestJS 11 + Prisma 6 + PostgreSQL). The public frontend lives in a separate repo (`Ninhachedotcomv4-seo`) and consumes the public (`@Public()`) endpoints here with ISR-style revalidation; the rest of the surface is the authenticated admin CRUD used to manage portfolio content.

## Commands

```bash
yarn start:dev          # watch-mode dev server (port from APP_PORT, default 5000)
yarn build              # nest build → dist/
yarn start:prod         # node dist/main
yarn test               # jest (all *.spec.ts under src/)
yarn test path/to.spec.ts          # single test file
yarn test -t "name of test"        # single test by name
yarn test:cov           # coverage → ../coverage
yarn test:e2e           # jest with test/jest-e2e.json

npx prisma migrate dev          # apply/create migrations against DATABASE_URL
npx prisma generate             # regenerate the Prisma client after schema edits
npx prisma db seed              # runs prisma/seed.ts (ts-node)

yarn db:dump                    # snapshot the live DB → prisma/snapshot.json (dump-seed.ts)
yarn db:restore                 # replay prisma/snapshot.json into the DB (seed-from-snapshot.ts)
```

Docker (full stack incl. Postgres):
```bash
docker compose up --build
docker compose exec backend npx prisma migrate dev
```

## Content snapshot workflow (local ⇄ live)

This is how the author promotes content edits: tweak the portfolio **locally** (admin
dashboard / DB), and when happy, push that content to the **live** site. The mechanism is a
pair of ts-node scripts that round-trip the whole DB through `prisma/snapshot.json`:

- `prisma/dump-seed.ts` (`yarn db:dump`) — reads every content table via Prisma and writes
  `prisma/snapshot.json`. Values are captured **raw** (alias `@@` tokens and `<projects>…`
  markers are NOT resolved); real ids are preserved so replay is idempotent (upsert by id).
  `User` rows are excluded (bootstrap admin via `POST /auth/register`); physical `uploads/`
  files are not captured, only the rows referencing them.
- `prisma/seed-from-snapshot.ts` (`yarn db:restore`) — replays `snapshot.json` into the DB.
  Upsert-only/non-destructive: rows absent from the snapshot are left untouched. Parents are
  written before dependents to satisfy FKs (skills → projects/companies/missions → positions;
  EMPLOYER companies before the CLIENT rows that point at them via `parentEmployerId`).

Typical promotion: edit locally → `yarn db:dump` → commit `snapshot.json` → on the live host
pull + `yarn db:restore`.

> ⚠️ **These two scripts mirror the schema by hand and MUST be updated whenever the data model
> changes.** They enumerate every model, field, and relation explicitly — Prisma does not keep
> them in sync. When you add/remove a model, field, or relation in `schema.prisma`:
> 1. **`dump-seed.ts`** — add/remove the `findMany` query + its `snapshot.*` mapping (capture
>    new scalar fields and relation id-lists, e.g. `skillIds`).
> 2. **`seed-from-snapshot.ts`** — add/remove the matching `upsert`, in **FK-dependency order**
>    (parents first; mind self-FKs like `Company.parentEmployerId`), and update the final
>    summary list.
> 3. Keep both **in lockstep** — they share the `snapshot.json` shape; changing one alone breaks
>    restore. Typecheck with `npx tsc --noEmit --skipLibCheck prisma/dump-seed.ts prisma/seed-from-snapshot.ts`.
> 4. Then regenerate: `yarn db:dump` (ideally after a backup, since it overwrites the committed
>    `snapshot.json`).
>
> **Automated guard:** `src/prisma/snapshot-coverage.spec.ts` (runs in `yarn test` / CI) parses
> `schema.prisma` and asserts every content model is referenced in BOTH scripts. The compiler
> already catches *removed/renamed* models (the scripts stop compiling); this test catches the
> silent case — an *added* model the scripts don't yet cover. When it fails, either wire the model
> into both scripts (fix 1/2 above) or add it to the test's `NOT_SNAPSHOTTED` allowlist with a
> reason if it's intentionally excluded.
>
> If a script references a model/field that no longer exists, it won't even compile — that's the
> signal it has drifted (this happened after the Skill/Tag merge and the Timeline addition).
> The **other** seeders — `prisma/seed.ts`, `prisma/seed-projects.ts` (seed from the legacy
> frontend JSON) and `prisma/migrate-experiences-to-timeline.ts` (one-shot migration) — have the
> same hand-mirrored-schema fragility; treat the migration script as frozen, but the JSON
> seeders need the same care if you still rely on them.

## Architecture

**Standard NestJS feature-module layout.** Each domain (`project`, `skill`, `tags`, `experience`, `contact`, `profile`, `resume`, `media`, `admin`, `auth`, `locales`) is a self-contained module under `src/<domain>/` with the conventional `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto/` / `entities/` split. `AppModule` (`src/app.module.ts`) wires them together.

**Database access is centralized in `PrismaService`** (`src/prisma/prisma.service.ts`) — a `PrismaClient` subclass that `$connect`s on module init. It's provided/exported by `PrismaModule`, which each feature module imports; services inject `PrismaService` (imported as `src/prisma/prisma.service` — note `baseUrl: ./` in tsconfig means `src/...` absolute-style imports, no path alias). There is no repository layer: services call `this.prisma.<model>.*` directly and own their own DTO ⇄ entity mapping (see `ProjectService.toDTO`).

**Auth is global-by-default, opt-out-public.** `JwtAuthGuard` is registered as a global `APP_GUARD` in `AppModule`, so **every route requires a Bearer JWT unless decorated with `@Public()`** (`src/auth/public.decorator.ts`). When adding a route the frontend/public must reach, you must add `@Public()` — otherwise it's admin-only. JWT is validated by `JwtStrategy` (`passport-jwt`, secret from `auth.jwt_secret`); `validate()` returns the `{ sub, email }` payload as `req.user`. Registration (`POST /auth/register`) is gated by a `?key=` query that must equal `ADMIN_PWD`; login returns `{ access_token }`.

**i18n via translation tables.** Every content model has a sibling `<Model>Translation` table keyed by `Locale` (`fr` | `en`) with a `@@unique([<model>Id, locale])`. The base model holds locale-independent fields (URLs, dates, flags, colors); translatable strings (name, description, etc.) live in the translation rows. When creating/updating content, write/connect translations alongside the parent. `GET /locales` returns the supported locale list.

**Alias engine (dynamic content interpolation).** `src/alias/` resolves `@@key` / `@@key(arg1,arg2)` markers (escape `@@@@` → `@@`) embedded in any content text field. Each alias is a per-locale JS body stored in DB (`Alias` / `AliasBody`) whose last line `return`s a value. Bodies run in an **`isolated-vm` isolate** (`sandbox.ts`) — no `process`/`require`/fs/network, ~50 ms timeout, fallback to `''` on throw/timeout/cycle (never crashes a request). The only scope is `$`: `$.<feed>` (DB-backed values pre-resolved host-side in `feeds.ts`), `$.args` (marker args), and `$.<otherAlias>` (lazy composition, memoised, cycle/depth-guarded). `AliasService.resolveObject(payload, locale)` deep-resolves a payload; a subtree with its own `locale` field resolves in that locale. Resolution is wired into the public read endpoints (`/project`, `/experiences`, `/profile`, `/contact`, `/skill/categories`, optional `?locale`, default `fr`), so the front never sees `@@`. Admin CRUD at `/admin/aliases` invalidates the in-memory definition cache + revalidates on each change (no redeploy). Adding a **feed** is the only change needing code (it implies a DB query kept out of the sandbox).

**Front revalidation + greeting cron.** `RevalidationService` POSTs `{ tags }` to `${FRONT_URL}/api/revalidate` with the `x-revalidate-secret` header; failures are logged, never failing the mutation. A `RevalidationInterceptor` fires it after any successful non-GET request on a `@RevalidateContent('<entity>')`-marked controller, emitting `<entity>` + `<entity>:fr|en` (+ `greeting` for profile). `GreetingCron` (`@nestjs/schedule`) revalidates the `greeting` tag hourly (Europe/Paris) — body-agnostic. The front must use the same tag names + `REVALIDATE_SECRET`.

**Media uploads** go through `MediaController` using `multer` `diskStorage` → the `uploads/` dir (served read-only at `/uploads` via `ServeStaticModule`). Files are renamed to `uuidv4 + ext`; uploads are constrained by `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE` (50 MB) defined at the top of `media.controller.ts`. Media rows optionally belong to a `Project`.

**Config & startup.** Config is split into namespaced `registerAs` factories under `src/config/` (`app`, `auth`, `doc`), aggregated in `src/config/index.ts`, loaded globally + cached by `ConfigModule`. Read values via `configService.get('app.port')` etc. `main.ts` (1) installs a global `ValidationPipe` with `{ transform, whitelist, forbidNonWhitelisted }` — so DTOs are the validation contract and unknown body fields are rejected — and (2) validates `process.env` against `AppEnvDto` (`src/config/dto/app.env.dto.ts`) at boot, throwing if required vars are missing/invalid. CORS origin is read from `TRUSTED_ORIGINS` (comma-separated) in `main.ts`.

**Swagger** is generated in `src/swagger.ts` (skipped when `NODE_ENV=production`), served under `doc.prefix` (default `/docs`), and written to `swagger.json` on each non-prod boot. The `@nestjs/swagger` CLI plugin (`nest-cli.json`) introspects DTO classes + comments, so OpenAPI docs come largely from the `class-validator`-decorated DTOs.

## Required environment variables

Validated at startup (`AppEnvDto`): `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PWD`, `TRUSTED_ORIGINS`, `APP_PORT`, `FRONT_URL`, `REVALIDATE_SECRET`. Optional (have defaults): `ALIAS_EVAL_TIMEOUT_MS` (50), `ALIAS_EVAL_MAX_DEPTH` (20). See `.env` for the dev defaults.

## Conventions

- **DTOs are the source of truth for I/O validation** — add `class-validator` decorators; `update-*.dto.ts` typically use `PartialType` of the create DTO. The global pipe strips/forbids non-whitelisted fields.
- **Tagging is polymorphic via `TagType`** (`TECH`, `QUAL`, `SKILL_CATEGORY`, `EXPERIENCE_TECH`) — one `Tag` model serves projects, skills, and experiences through named Prisma relations.
- **Schema changes**: edit `prisma/schema.prisma`, then `prisma migrate dev` (migrations are committed under `prisma/migrations/`) and `prisma generate`. Relations use `relationMode = "foreignKeys"` with `onDelete: Cascade` on translation tables.

## Tooling note

Both ESLint (`.eslintrc.js`, Prettier-integrated) and Biome (`biome.json`, 4-space, 80-col) configs are present; formatting/indentation is inconsistent across modules as a result. Match the style of the file you're editing rather than reformatting wholesale.
