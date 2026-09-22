# Photo Albums (`/photos`)

Snapshot of the gallery design and implementation as of 2026-09-13.

Wedding-site gallery: 9 albums, ~20 photos each, rustic cream/tan style matching the existing site.

## Status

Shipped in the codebase. Remaining ops work:

- [x] Routes, UI, lightbox, password gate, image proxy, ingest script
- [x] Nav + Home Photos links
- [ ] Create **private** Vercel Blob store and connect this project
- [ ] Set `PHOTOS_PASSWORD` in Vercel env (Production / Preview / Development)
- [ ] Drop real photos into `photos-source/{slug}/` and run `npm run photos:upload`
- [ ] Commit updated `lib/album-photos.json` and deploy

Local preview without Blob: `npm run photos:local` (writes `photos-local/` + the JSON manifest). Dev image route serves `photos-local/` when not in production.

## Locked decisions

- **Storage:** Vercel Blob, **private**. Photos are resized on your machine, then uploaded. Originals never go to Vercel or git.
- **Ingest:** One-shot folder drop + a Node script. Filename sort is the order (`01-…`, `02-…`).
- **Access:** Shared guest password (not the admin dashboard password). HttpOnly cookie, same pattern as `/admin`.
- **Nav:** **Photos** in the horizontal menu and a Photos button on Home. Keep RSVP / Details / Registry.
- **Album cover:** First file in sort order (rename to `01-…` to change the cover).
- **Lightbox:** Full-viewport overlay; close / prev / next / keyboard / swipe; deep-link `?p=N`; disable right-click on photos.
- **Copy:** Album title only. No per-photo captions.
- **Albums (display order):**

  | Title | Slug / folder |
  | --- | --- |
  | Bride & Groom | `bride-and-groom` |
  | Getting Ready | `getting-ready` |
  | First Look | `first-look` |
  | Family | `family` |
  | Ceremony | `ceremony` |
  | Reception | `reception` |
  | Sunset | `sunset` |
  | Departure | `departure` |
  | Black & White | `black-and-white` |

Titles/slugs live in `lib/album-defs.ts`. Photo filenames live in `lib/album-photos.json` (rewritten by the ingest script).

---

## Vercel “photo storage”

Vercel does **not** have a dedicated photo product. The dashboard **Images** tab plus **OCI** is **Vercel Container Registry** (Docker images at `vcr.vercel.com`), not JPEGs. Do not use it for this feature.

Use project **Storage → Blob**. Observability **Image Optimization** is the `next/image` resize meter.

| Piece | What it actually does |
| --- | --- |
| **Vercel Blob** | Object storage + CDN. Public or private files. This is where the photos live. |
| **Image Optimization (`next/image`)** | On-request resize. The source file must still be fetchable. Default `deviceSizes` include **3840**, over the 3000px cap. |
| **`putImage()` / `vercel blob put-image`** | Resize at upload by **width only**. A tall portrait at `width: 3000` becomes taller than 3000px. |

**Chosen approach:** do **not** use `next/image` or `putImage()`.

1. Local **sharp** (`scripts/process-photos.ts`):
   - Honor EXIF orientation, then strip EXIF/GPS.
   - Full: fit inside **3000×3000** (longest edge ≤ 3000, never upscale), WebP.
   - Thumb: **300×300** center crop, WebP.
2. `put()` those two files to **private** Blob (`access: 'private'`).
3. Pages request images through `/photos/file/...`, which checks the guest cookie, then `get()`s the blob (or reads `photos-local/` in development). HTML never contains `*.blob.vercel-storage.com` URLs.

**Protection reality:** 3000px is still a usable photo. Password + private Blob stops random visitors and search engines. Right-click disable is friction only.

A page password in front of **public** Blob is theater. Store is private. Manifest stores filenames, not public URLs. Image responses use `Cache-Control: private, max-age=86400`.

Admin stays on `DASHBOARD_PASSWORD` / `admin_session`. Guests use `PHOTOS_PASSWORD` / `photos_session`.

---

## Password gate

- Env: `PHOTOS_PASSWORD` (not `NEXT_PUBLIC_*`).
- Cookie: `photos_session=authenticated`, httpOnly, secure in production, `path=/`, ~30 days.
- `proxy.ts` matcher: `/admin/:path*`, `/photos`, `/photos/:path*`. Allow `/photos/login`. Unauthenticated `/photos/file/...` returns **401**; other `/photos` paths redirect to login with a safe `next` query (must start with `/photos`).
- `/photos/login`: rustic password form. Success redirects to `next` (default `/photos`) so deep links survive login.
- No password on the public homepage copy.

---

## Folder + naming contract

Gitignored, never committed:

```
photos-source/
  bride-and-groom/
    01-….jpg
  getting-ready/
  first-look/
  family/
  ceremony/
  reception/
  sunset/
  departure/
  black-and-white/
```

Rules:

- Folder name = URL slug (`/photos/bride-and-groom`).
- Zero-padded numeric prefix is display order (`01` … `20`).
- Cover = first file after sort (`01-…`).

Blob / local output:

```
photos/{slug}/{basename}.webp          # ≤3000px, original aspect
photos/{slug}/thumbs/{basename}.webp   # 300×300, center crop
```

Commands:

- `npm run photos:local` — process into `photos-local/`, rewrite `lib/album-photos.json`, no Blob upload.
- `npm run photos:upload` — same, plus private Blob `put()` (`allowOverwrite: true`).

`.gitignore`: `photos-source/`, `photos-local/`. Commit `lib/album-photos.json` after a real upload.

---

## Routes and UI

| Route | Content |
| --- | --- |
| `/photos/login` | Guest password form. |
| `/photos` | Album index: 9 cards, square cover thumb + title (placeholder square if empty). |
| `/photos/[slug]` | Album grid, or “coming soon” if empty. `?p=12` (1-based) opens the lightbox. |
| `/photos/file/[...pathname]` | Cookie-gated image proxy. |

**Grid:** CSS grid, square cells. ~2 columns phone, 3 tablet, 4 desktop.

**Lightbox:**

- `position: fixed; inset: 0`; opaque `--rustic-brown` overlay; `z-index: 100`.
- Full photo `object-contain`.
- Close (X + Esc + overlay click), prev/next (buttons, arrows, swipe). Wrap at album ends.
- Deep link: `index` is React state; URL is synced in a `useEffect` via `history.replaceState` (do **not** call `replaceState` inside a `setState` updater — Next patches history and will throw “Cannot update Router while rendering PhotoAlbum”).
- Close clears `p`. Invalid `p` → grid only.
- `onContextMenu` preventDefault; `draggable={false}`; CSS `user-select: none` / `-webkit-touch-callout: none`. No download button.

**Nav / home:** Photos in `components/Menu.tsx` (active for `/photos` and children). Home Photos button.

Unknown slug → `notFound()`. Photos layout sets `robots: noindex`.

---

## Style

Existing tokens only: `--cream`, `--soft-white`, `--rustic-brown`, `--accent-tan`, Playfair headings, Libre Baskerville body, `.rustic-line`, `.subtitle`. Gallery CSS in `app/globals.css`.

---

## Files

- `lib/album-defs.ts` — titles + slugs (source of truth)
- `lib/album-photos.json` — filenames per slug (script output)
- `lib/albums.ts` — helpers: `photoSrc`, `getAlbum`, `albumCover`
- `lib/photos-auth.ts` — cookie name/value, `safePhotosNext`
- `app/photos/page.tsx` — index
- `app/photos/[slug]/page.tsx` — album
- `app/photos/login/page.tsx` + `actions.ts`
- `app/photos/file/[...pathname]/route.ts`
- `app/photos/layout.tsx` — metadata / noindex
- `components/PhotoAlbum.tsx` — grid + lightbox
- `components/ProtectedImage.tsx` — no right-click
- `scripts/process-photos.ts`
- `proxy.ts` — `/photos` gate
- `app/globals.css`, `components/Menu.tsx`, `app/page.tsx`
- `.gitignore` — `photos-source/`, `photos-local/`
- `package.json` — `sharp`, `@vercel/blob`, `tsx`; `photos:upload` / `photos:local`

No Turso tables. No admin uploader.

---

## Vercel setup (one-time)

1. Project → Storage → Create Blob store, **private**.
2. Connect to this project (Production + Preview + Development).
3. Set `PHOTOS_PASSWORD`.
4. `vercel env pull` for local Blob token + password.
5. Fill `photos-source/{slug}/`, run `npm run photos:upload`.
6. Commit `lib/album-photos.json` and deploy.

Replace a photo: overwrite the numbered file in `photos-source`, re-run the script, commit the manifest if names changed.

---

## Out of scope (v1)

- Admin photo uploader
- Per-photo captions
- Watermarks
- Putting originals in git `public/`
- Using `next/image` as the size cap
- Per-album passwords
- Vercel Container Registry / OCI images

## Still optional

- Photographer credit line on `/photos`
- Whether RSVP should leave the nav now that the wedding is over
