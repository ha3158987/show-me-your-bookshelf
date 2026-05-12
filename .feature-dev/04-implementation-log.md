# Phase 4 Implementation Log

## Tasks completed (1–5)

### ✅ Task 1 — Test toolchain
- Installed Vitest **v2.1.9** (Vitest 4 incompatible with Node 20.11 — `styleText` from `node:util` not available), `@vitejs/plugin-react@^4`, jsdom **v25** (jsdom 29 ESM issues with Vitest 2/Node 20.11), Testing Library, fake-indexeddb.
- `vitest.config.ts`, `tests/setup.ts` (with cleanup + fake-indexeddb auto-bootstrap).
- npm scripts added: `test`, `test:watch`, `typecheck`.
- Sanity test passes (1/1).

### ✅ Task 2 — Runtime deps
- `@supabase/supabase-js`, `idb-keyval`, `html2canvas`, `uuid` installed.

### ✅ Task 3 — DESIGN.md tokens
- `tailwind.config.ts` rewritten with full DESIGN.md palette, radii (`none/sm/md/lg/full`), spacing scale (`xxs..section`), fontFamily, fontSize tokens (`display-xl..button-sm`), modal shadow.
- `app/globals.css` rewritten with CSS variables mirroring tokens and focus-visible ring per DESIGN.md.

### ✅ Task 4 — Geist → Inter
- `app/layout.tsx` switched to `next/font/google` Inter w400/500/600/700 with `variable: "--font-inter"`. Removed `app/fonts/Geist*.woff` files.
- Added viewport meta with theme-color = Pinterest Red `#e60023` and manifest pointer.

### ⚠️ Task 5 — Pencil design (pivoted)
- Opened a Pencil document and built a `BookCard` reusable component + 9-up 3×3 library grid plus header, but **Pencil PNG export consistently returned blank images** in this MCP environment.
- Confirmed root cause: the MCP edit operations don't persist to the on-disk `.pen` file (`pencil-new.pen` stayed at 259 bytes), and `export_nodes` reads the stale on-disk file.
- Pivot: hand-coded 5 static SVG mockups in `docs/design/` (design tokens reference + the 4 screens). All 5 files render correctly in any environment and embed cleanly in README.
- The placeholder `.pen` artifact is saved at `lib/pencil/bookshelf.pen` for future iteration in the Pencil app once the MCP persistence issue is fixed.

## Status

Pre-task gate accomplished. Ready to continue with Task 6 (domain types) at user's discretion. Plan tasks 6–24 untouched.

## Mid-Phase 4 design swap (post-Task 5)

User requested swap from Pinterest-derived design system to **Webflow-derived** (`npx getdesign@latest add webflow`).

Applied:
- `DESIGN.md` replaced (Pinterest → Webflow). Source committed to repo root.
- `tailwind.config.ts` rewritten with new tokens: primary `#080808`, 5-stop chromatic accents (purple/pink/blue/orange/green), radii `none/xs(2)/sm(4)/md(8)/full(9999)`, spacing `xxs..3xl` (4 px base), display-xxl…caption-mono type scale, layered/modal shadow recipes.
- `app/globals.css` updated CSS variables and focus ring (now single 2 px ink outline).
- `app/layout.tsx` viewport `themeColor` `#e60023` → `#080808`.
- All 5 SVG mockups in `docs/design/` regenerated with Webflow palette and 4 / 8 px geometry. Book covers use the chromatic palette as Webflow-style category-card fills (also serves as image-missing fallback per spec §3.1).
- Design spec §3 component map rewritten (Pinterest → Webflow component names: `card-feature`, `button-primary` 4 px, `ex-modal-card`, `text-input`).
- `docs/design/README.md` updated.

No data / API / test-toolchain changes. Tasks 6–24 remain untouched. Implementation can resume from Task 6 (domain types) when the user approves.

## Library "shelf room" treatment (post-Webflow swap)

User wanted Library page to feel like a physical bookshelf with depth (referenced an iOS Apple Books–style screenshot for the shelf+drop-shadow detail). Applied within the Webflow design system as a `card-feature-dark` polarity exception for the home page only.

Applied:
- New tokens in `tailwind.config.ts`: `shelf-bg #1a1a1a`, `shelf-edge #3a3a3a`, `shelf-shadow #0a0a0a`, and `shadow-book` (multi-stop book contact shadow recipe).
- `docs/design/01-library.svg` redesigned with:
  - Dark vertical-gradient room background
  - iOS status-bar mockup, dark header, section divider row (search + eyebrow + shelf glyph)
  - 3 rows of books with per-row shelf plank (1 px shelf-edge top + 18 px linear-gradient shadow band beneath)
  - Per-book elliptical contact shadow (radial gradient)
  - More varied cover compositions (abstract elements + chromatic accents) to communicate book variety
  - Partial 4th-row peek at bottom edge to suggest infinite scroll
- Design spec §3.3 added documenting the shelf-room CSS pattern with pseudo-code.
- `docs/design/README.md` updated.

Other screens (Add Book Sheet, Book Detail, Auth Modal) stay light per Webflow base — the dark shelf is a Library-page exception, not a global theme.

## Library shelf revision — light mode + stronger shadow (post-feedback)

User clarified: the Apple Books reference was for the **physical-shelf depth feeling only**, not the dark color. Wanted light background restored, no iOS status-bar chrome, and stronger shadow gradients.

Applied:
- Removed `shelf-bg / shelf-edge / shelf-shadow` color tokens (no longer needed in light mode).
- `shadow-book` strengthened to 3-stop multi-offset recipe (0.22 / 0.18 / 0.10) — visible on white canvas.
- New `shadow-shelf` token: hairline bottom rule + 2-stop deep drop shadow.
- `docs/design/01-library.svg` rewritten:
  - White `#ffffff` canvas (no dark room background)
  - iOS status bar removed entirely
  - Header retains AddFab (hairline-outlined circle on light) + "내 서재" title + "로그인"
  - Section eyebrow + hairline divider
  - 3 rows of books — each row ends with a strong 34 px linear-gradient shadow band (opacity 0.42 → 0)
  - Per-book elliptical contact shadow stays
  - 4th-row peek removed
- Design spec §3.3 rewritten — "Shelf plank" (light mode) replaces "Shelf room" (dark mode). CSS pseudo-code uses pure rgba shadow over canvas; no dark surface.
- `docs/design/README.md` updated.

## What's pending (Tasks 6–24)

6. Domain types (`lib/db/types.ts`)
7. `LibraryStorage` interface
8. IndexedDB implementation (TDD)
9. Supabase storage implementation (TDD)
10. Storage factory + migration
11. `fetchBookByIsbn` extension
12–13. UI primitives (Button, IconButton, Input, SearchBar, Modal)
14. BookCard / BookGrid / EmptyState
15. AddBookFab + AddBookSheet
16. Auth (Provider, Modal, ProfileChip)
17. LibraryView composition + migration trigger
18. Book detail page
19. QuoteCardCapture (html2canvas)
20. PWA manifest + service worker
21. `.env.local.example`
22. Supabase schema migration
23. README rewrite
24. Final verification
