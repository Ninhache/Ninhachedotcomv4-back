# Spec — Uniform media handling (admin + back)

Status: **Phase 1 done — string-field model (revised 2026-06-06)**
Date: 2026-06-06
Spans: `back/` (per-entity URL columns, shared `POST /media` upload) and
`portfolio/` (shared `MediaUploadField` + `MediaApi`, forms, public mappers).

> **Direction change (2026-06-06).** An earlier draft of this spec proposed a
> relational asset model: a generalized `Media` entity with type/metadata that
> owners link to by FK (`Mission.assetId`, a Project join table, `POST
> /media/from-url` to wrap static paths, an `AssetPicker`). That was built as a
> Mission pilot, then **reverted** — the owner preferred the way experiences
> (companies) already work: a plain URL **string** on the entity plus a small
> upload-to-path button. The string model is also what most entities already use
> (`Company.logoUrl`, `Skill.image`, `Education.logoUrl`, `Contact.imageUrl`,
> `Profile.imageUrl`). So the goal is **uniformity via the simple existing
> pattern**, not a new relational layer. Flat over clever.

## 1. Problem

Image handling was inconsistent: most entities store a URL string but each form
wired its own upload/preview block (or none), there were two duplicated upload
clients (`CompanyApi.uploadLogo`, `ProjectApi.uploadMedia`) both hitting the same
`POST /media`, validation drifted (Contact rejected `/uploads/…` via `@IsUrl`,
others accepted them), and Mission had no own image at all (it borrowed the
company logo at render).

Goal: **every owner stores a plain URL string, filled through one shared upload
component backed by one upload endpoint** — same UX and same code everywhere.

## 2. Model

- **Owners hold a plain string.** A path/URL: an uploaded `/uploads/<uuid>.ext`
  path, a static `public/` ref (e.g. `svg/skills/C.svg`), or an external URL.
  Resolved client-side by `mediaSrc()`. No FK, no nested object on reads.
  - Single-image owners: `Company.logoUrl`, `Skill.image`, `Mission.imageUrl`
    (added Phase 1), `Education.logoUrl`, `Contact.imageUrl`, `Profile.imageUrl`.
  - Project keeps its `Media[]` relation for **N-image galleries** (the one
    many-media owner); each gallery item is still produced by the same upload.
- **`Media` table = the upload record only.** `POST /media` writes the file to
  `uploads/` and returns a row whose `mediaUrl` is the `/uploads/...` path. The
  caller stores that **string** on its own field. Media rows are not linked back
  to single-image owners (a logo upload leaves an unreferenced Media row — an
  accepted, pre-existing trade-off; the file is what matters, served statically).

## 3. Shared pieces (the uniformity)

- **Back — one endpoint:** `POST /media` (multipart, auth, mime allowlist, 50 MB,
  ffmpeg `+faststart` for MP4/MOV). Returns `{ mediaUrl, ... }`. Unchanged.
- **Front — one upload client:** `lib/media/media.api.ts` → `MediaApi.upload(file)`
  returns the `mediaUrl` string. Replaces the per-resource `uploadLogo`/
  `uploadMedia` duplicates.
- **Front — one field component:** `components/forms/media-upload-field.tsx` →
  `MediaUploadField`. A plain string field with: an `Input` (paste URL/`public/`
  path), a "Téléverser un fichier" button (→ `MediaApi.upload` → drops the path
  into the field), an inline preview (img, or `<video>` for `.mp4/.webm/.mov/.m4v`),
  and a "Retirer" clear. `accept="media"` allows video; default is image-only.
  Every owner form renders this — that *is* the uniformity.

## 4. Rollout

- **Phase 1 — DONE (2026-06-06):**
  - Back: `Mission.imageUrl String?` added; the Phase-1 FK pilot reverted
    (migration `20260606122101_simplify_mission_image_to_string` drops
    `Mission.assetId` + FK, adds `imageUrl`; `/media/from-url` + its DTO removed;
    mission service no longer depends on MediaService). `Media.order` kept (29
    rows, harmless; reserved for Project gallery ordering).
  - Front: `MediaApi` + `MediaUploadField` created. Mission form uses it
    (`imageUrl`). **Company form refactored** to use it too (proves sameness;
    `CompanyApi.uploadLogo` removed). Mapper: mission card/modal logo prefers
    `mission.imageUrl`, else client/employer logo fallback.
- **Phase 2 — pending:** point the remaining single-image forms at
  `MediaUploadField` for consistent UX — Skill (`image`), Education (`logoUrl`),
  Contact (`imageUrl`), Profile (`imageUrl`). Pure front refactor; no schema
  change. Relax the back's `@IsUrl` on Contact (and Skill `image`) so pasted
  `/uploads/…` and `public/` paths validate.
- **Phase 3 — pending:** Project gallery (`Media[]`) — a multi-item variant of
  the same field (list of `MediaUploadField`s + `order`). Bigger; do last.

## 5. Acceptance — Phase 1

- [x] Backend builds; mission + media unit tests pass (4/4).
- [x] `GET /missions` / `/timeline` return `imageUrl` (string|null); no `asset`/
      `assetId` keys. Verified live.
- [x] Migration drops `Mission.assetId` cleanly (column was all-null); adds
      `imageUrl`. DB backup taken first (`.backups/`).
- [x] Front builds; biome clean. Mission + Company forms share `MediaUploadField`.
- [ ] **Needs the user (auth/UI):** in the admin, set a mission image two ways
      (upload a file; paste `svg/skills/C.svg`) → save → public mission card shows
      it, with company-logo fallback when cleared. Auth-gated + visual, so the
      owner verifies via the running admin UI.
