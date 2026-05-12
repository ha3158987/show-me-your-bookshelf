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
