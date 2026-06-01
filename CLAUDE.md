# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Backend + admin API for the `ninhache.com` V4 portfolio (NestJS 10 + Prisma 6 + PostgreSQL). The public frontend lives in a separate repo (`Ninhachedotcomv4-seo`) and consumes the public (`@Public()`) endpoints here with ISR-style revalidation; the rest of the surface is the authenticated admin CRUD used to manage portfolio content.

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
```

Docker (full stack incl. Postgres):
```bash
docker compose up --build
docker compose exec backend npx prisma migrate dev
```

## Architecture

**Standard NestJS feature-module layout.** Each domain (`project`, `skill`, `tags`, `experience`, `contact`, `profile`, `resume`, `media`, `admin`, `auth`, `locales`) is a self-contained module under `src/<domain>/` with the conventional `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto/` / `entities/` split. `AppModule` (`src/app.module.ts`) wires them together.

**Database access is centralized in `PrismaService`** (`src/prisma/prisma.service.ts`) — a `PrismaClient` subclass that `$connect`s on module init. It's provided/exported by `PrismaModule`, which each feature module imports; services inject `PrismaService` (imported as `src/prisma/prisma.service` — note `baseUrl: ./` in tsconfig means `src/...` absolute-style imports, no path alias). There is no repository layer: services call `this.prisma.<model>.*` directly and own their own DTO ⇄ entity mapping (see `ProjectService.toDTO`).

**Auth is global-by-default, opt-out-public.** `JwtAuthGuard` is registered as a global `APP_GUARD` in `AppModule`, so **every route requires a Bearer JWT unless decorated with `@Public()`** (`src/auth/public.decorator.ts`). When adding a route the frontend/public must reach, you must add `@Public()` — otherwise it's admin-only. JWT is validated by `JwtStrategy` (`passport-jwt`, secret from `auth.jwt_secret`); `validate()` returns the `{ sub, email }` payload as `req.user`. Registration (`POST /auth/register`) is gated by a `?key=` query that must equal `ADMIN_PWD`; login returns `{ access_token }`.

**i18n via translation tables.** Every content model has a sibling `<Model>Translation` table keyed by `Locale` (`fr` | `en`) with a `@@unique([<model>Id, locale])`. The base model holds locale-independent fields (URLs, dates, flags, colors); translatable strings (name, description, etc.) live in the translation rows. When creating/updating content, write/connect translations alongside the parent. `GET /locales` returns the supported locale list.

**Media uploads** go through `MediaController` using `multer` `diskStorage` → the `uploads/` dir (served read-only at `/uploads` via `ServeStaticModule`). Files are renamed to `uuidv4 + ext`; uploads are constrained by `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE` (50 MB) defined at the top of `media.controller.ts`. Media rows optionally belong to a `Project`.

**Config & startup.** Config is split into namespaced `registerAs` factories under `src/config/` (`app`, `auth`, `doc`), aggregated in `src/config/index.ts`, loaded globally + cached by `ConfigModule`. Read values via `configService.get('app.port')` etc. `main.ts` (1) installs a global `ValidationPipe` with `{ transform, whitelist, forbidNonWhitelisted }` — so DTOs are the validation contract and unknown body fields are rejected — and (2) validates `process.env` against `AppEnvDto` (`src/config/dto/app.env.dto.ts`) at boot, throwing if required vars are missing/invalid. CORS origin is currently hardcoded to `http://localhost:3001` in `main.ts` (note: `TRUSTED_ORIGINS` env exists but isn't yet wired into the CORS config).

**Swagger** is generated in `src/swagger.ts` (skipped when `NODE_ENV=production`), served under `doc.prefix` (default `/docs`), and written to `swagger.json` on each non-prod boot. The `@nestjs/swagger` CLI plugin (`nest-cli.json`) introspects DTO classes + comments, so OpenAPI docs come largely from the `class-validator`-decorated DTOs.

## Required environment variables

Validated at startup (`AppEnvDto`): `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PWD`, `TRUSTED_ORIGINS`, `APP_PORT`. See `.env` for the dev defaults.

## Conventions

- **DTOs are the source of truth for I/O validation** — add `class-validator` decorators; `update-*.dto.ts` typically use `PartialType` of the create DTO. The global pipe strips/forbids non-whitelisted fields.
- **Tagging is polymorphic via `TagType`** (`TECH`, `QUAL`, `SKILL_CATEGORY`, `EXPERIENCE_TECH`) — one `Tag` model serves projects, skills, and experiences through named Prisma relations.
- **Schema changes**: edit `prisma/schema.prisma`, then `prisma migrate dev` (migrations are committed under `prisma/migrations/`) and `prisma generate`. Relations use `relationMode = "foreignKeys"` with `onDelete: Cascade` on translation tables.

## Tooling note

Both ESLint (`.eslintrc.js`, Prettier-integrated) and Biome (`biome.json`, 4-space, 80-col) configs are present; formatting/indentation is inconsistent across modules as a result. Match the style of the file you're editing rather than reformatting wholesale.
