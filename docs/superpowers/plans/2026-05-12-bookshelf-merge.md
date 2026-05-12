# Bookshelf Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `quote-sharing` features into the `bookshelf` Next.js project to ship a personal electronic bookshelf with ISBN-based registration, 3-up "bestseller corner" grid, guest-to-cloud migration, and PNG quote-card sharing — all faithful to the Pinterest-derived DESIGN.md.

**Architecture:** Next.js 15 App Router PWA. `LibraryStorage` interface decouples UI from persistence; IndexedDB implementation backs guest mode, Supabase implementation backs signed-in mode. A `migrateLocalToCloud()` function copies state on first sign-in. DESIGN.md tokens are injected into `tailwind.config.ts` so design and code share one vocabulary. Pencil documents drive the visual spec.

**Tech Stack:** Next.js 15.5 · React 19 · TypeScript 5 (strict) · Tailwind v3.4 · `@supabase/supabase-js` · `idb-keyval` · `html2canvas` · `uuid` · Vitest + React Testing Library + jsdom · `fake-indexeddb`. Pencil MCP for design.

---

## File Structure Overview

**Created:**
```
app/
  globals.css                          (rewritten)
  layout.tsx                           (rewritten: Inter font, AuthProvider)
  page.tsx                             (rewritten: LibraryView wrapper)
  book/[isbn]/page.tsx                 (new)
  auth/callback/route.ts               (new)
components/
  ui/Button.tsx, IconButton.tsx, Input.tsx, SearchBar.tsx, Modal.tsx
  library/LibraryView.tsx, BookGrid.tsx, BookCard.tsx, EmptyState.tsx
  add-book/AddBookFab.tsx, AddBookSheet.tsx, SearchResultCard.tsx
  book-detail/BookDetailHero.tsx, QuoteList.tsx, QuoteAddSheet.tsx, QuoteCardCapture.tsx
  auth/AuthProvider.tsx, AuthModal.tsx, ProfileChip.tsx
lib/
  db/types.ts, storage.ts, localStorage.ts, supabaseStorage.ts, migrate.ts, index.ts
  auth/supabase.ts
  pencil/bookshelf.pen                 (Pencil design file, binary)
utils/
  api.ts                               (extended)
public/
  manifest.webmanifest, icons/192.png, icons/512.png, icons/maskable.png
  sw.js                                (service worker, generated via @serwist/next)
tests/
  setup.ts, helpers/                   (testing infra)
docs/
  design/                              (Pencil PNG exports)
```

**Modified:**
- `package.json` (deps + scripts)
- `tailwind.config.ts` (DESIGN.md tokens)
- `tsconfig.json` (vitest types)
- `next.config.ts` (@serwist/next wrap)
- `.eslintrc.json` (relax for tests dir)
- `app/layout.tsx`, `app/page.tsx`, `utils/api.ts`
- `.gitignore` (`.pencil/`, `coverage/`)
- `README.md` (last task)

**Removed:**
- `app/dashboard/` (stub, not used)
- `app/fonts/GeistVF.woff`, `GeistMonoVF.woff` (replaced by Inter from next/font/google)

---

## Task 1: Install test toolchain (Vitest + RTL + jsdom)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Install dev deps**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  fake-indexeddb @types/uuid
```
Expected: `package.json` updated, no peer-dep errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());
```

- [ ] **Step 4: Add npm scripts**

Edit `package.json` `scripts` block to add:
```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Sanity test**

Create `tests/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("toolchain", () => {
  it("works", () => expect(1 + 1).toBe(2));
});
```
Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "chore: add vitest + testing library + fake-indexeddb"
```

---

## Task 2: Install runtime deps

**Files:** `package.json` only.

- [ ] **Step 1: Install**

Run:
```bash
npm install @supabase/supabase-js idb-keyval html2canvas uuid
```

- [ ] **Step 2: Verify package.json**

Confirm `dependencies` now contains: `@supabase/supabase-js`, `axios`, `html2canvas`, `idb-keyval`, `next`, `react`, `react-dom`, `uuid`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase, idb-keyval, html2canvas, uuid"
```

---

## Task 3: Inject DESIGN.md tokens into Tailwind + globals.css

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Rewrite `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e60023",
        "primary-pressed": "#cc001f",
        ink: "#000000",
        "ink-soft": "#211922",
        body: "#33332e",
        charcoal: "#262622",
        mute: "#62625b",
        ash: "#91918c",
        stone: "#c8c8c1",
        hairline: "#dadad3",
        "hairline-soft": "#e5e5e0",
        canvas: "#ffffff",
        "surface-soft": "#fbfbf9",
        "surface-card": "#f6f6f3",
        "surface-elevated": "#ffffff",
        "secondary-bg": "#e5e5e0",
        "secondary-pressed": "#c8c8c1",
        "surface-dark": "#262622",
        "focus-outer": "#435ee5",
        error: "#9e0a0a",
        "success-pale": "#c7f0da",
      },
      borderRadius: {
        none: "0px",
        sm: "8px",
        md: "16px",
        lg: "32px",
        full: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
        section: "64px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["70px", { lineHeight: "1.1", letterSpacing: "-1.2px", fontWeight: "600" }],
        "display-lg": ["44px", { lineHeight: "1.15", letterSpacing: "-0.8px", fontWeight: "700" }],
        "heading-xl": ["28px", { lineHeight: "1.2", letterSpacing: "-1.2px", fontWeight: "700" }],
        "heading-lg": ["22px", { lineHeight: "1.25", fontWeight: "600" }],
        "heading-md": ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.4" }],
        "body-strong": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "1.4" }],
        "body-sm-strong": ["14px", { lineHeight: "1.4", fontWeight: "700" }],
        "caption-md": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        "caption-sm": ["12px", { lineHeight: "1.4" }],
        "button-md": ["14px", { lineHeight: "1", fontWeight: "700" }],
        "button-sm": ["12px", { lineHeight: "1", fontWeight: "700" }],
      },
      boxShadow: {
        modal: "0 16px 32px rgba(0,0,0,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Rewrite `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* DESIGN.md tokens as CSS variables (twin of tailwind config) */
  --color-primary: #e60023;
  --color-canvas: #ffffff;
  --color-surface-card: #f6f6f3;
  --color-ink: #000000;
  --color-body: #33332e;
  --color-mute: #62625b;
  --color-ash: #91918c;
  --color-hairline: #dadad3;
}

html, body {
  background: var(--color-canvas);
  color: var(--color-body);
}

body {
  font-family: var(--font-inter), -apple-system, system-ui, Segoe UI, Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Focus ring per DESIGN.md (2px outer + 1px white gap) */
:focus-visible {
  outline: 2px solid var(--color-focus-outer, #435ee5);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat(design): inject DESIGN.md tokens into Tailwind config and globals"
```

---

## Task 4: Replace Geist with Inter, prepare app/layout.tsx

**Files:**
- Modify: `app/layout.tsx`
- Delete: `app/fonts/GeistVF.woff`, `app/fonts/GeistMonoVF.woff` (after rewrite)

- [ ] **Step 1: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Ones I Read",
  description: "Your personal electronic bookshelf — collect books by ISBN and share favorite passages.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#e60023",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="min-h-screen bg-canvas text-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Delete old Geist font files**

```bash
rm -rf app/fonts
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/fonts
git commit -m "feat: replace Geist with Inter (Pin Sans substitute per DESIGN.md)"
```

---

## Task 5: Pencil design — generate 4 mockup pages

**Files:**
- Create: `lib/pencil/bookshelf.pen`
- Create: `docs/design/library.png`, `add-book-sheet.png`, `book-detail.png`, `auth-modal.png`

- [ ] **Step 1: Open Pencil document**

Use `mcp__pencil__open_document` with path `lib/pencil/bookshelf.pen` (creates if missing).

- [ ] **Step 2: Seed Pencil variables from DESIGN.md**

Use `mcp__pencil__set_variables` to register colors, radii, spacing, typography tokens listed in DESIGN.md front matter.

- [ ] **Step 3: Design Library / Home page (mobile + desktop frames)**

Use `mcp__pencil__batch_design` to lay out:
- Top bar: 40px circular `+` button (`button-icon-circular`, surface-card bg) at left, title "내 서재" (heading-lg, ink), profile chip at right
- Grid: 3 columns, 8px gutter, padding-inline 12px. Each cell: 2:3 portrait `pin-card` (16px radius, surface-card), book title (body-sm-strong, ink) + author (caption-md, mute) beneath cover.
- Show two frames: empty state (illustration + "+ 책 추가" primary CTA) and populated state (9 sample books).

- [ ] **Step 4: Design Add Book Sheet**

Bottom sheet on mobile / centered modal on desktop. `modal-card` (rounded-lg 32px, padding 32, canvas bg). Heading "책 추가" (heading-lg). `search-bar` (rounded-full, surface-card) "ISBN 또는 제목으로 검색". Below: 3 result cards each showing 64×96 cover + title/author/publisher + primary "내 서재에 담기" button (Pinterest Red).

- [ ] **Step 5: Design Book Detail page**

Mobile: 1-col. Hero = `pin-card-large` (32px radius) cover at top, title (heading-xl), author (body-md mute), publisher (body-sm mute). "구절 추가" primary CTA. Quote cards beneath: each is a surface-card 16px-radius card with body-md quote text + "공유 (PNG 저장)" tertiary button.

- [ ] **Step 6: Design Auth Modal**

`modal-card` 32px radius, 50% scrim. "환영합니다" (heading-lg). `text-input` for 이메일, password. Primary "계속" button. "Google로 계속" secondary button. Small link "게스트로 둘러보기".

- [ ] **Step 7: Export each frame to PNG**

Use `mcp__pencil__export_nodes` with `format: "png"` saving to `docs/design/library.png`, `add-book-sheet.png`, `book-detail.png`, `auth-modal.png`.

- [ ] **Step 8: Commit**

```bash
git add lib/pencil/bookshelf.pen docs/design/
git commit -m "design: create Pencil mockups for library, add-book, book-detail, auth-modal"
```

---

## Task 6: Domain types

**Files:**
- Create: `lib/db/types.ts`
- Test: `tests/lib/db/types.test.ts`

- [ ] **Step 1: Write the failing type test**

Create `tests/lib/db/types.test.ts`:
```ts
import { describe, it, expectTypeOf } from "vitest";
import type { Book, Quote, LibraryEntry } from "@/lib/db/types";

describe("domain types", () => {
  it("Book requires isbn and title only", () => {
    const b: Book = { isbn: "9788960773431", title: "이방인" };
    expectTypeOf(b).toMatchTypeOf<Book>();
  });
  it("Quote requires id, bookIsbn, text, createdAt", () => {
    const q: Quote = { id: "u", bookIsbn: "9788960773431", text: "...", createdAt: "2026-05-12" };
    expectTypeOf(q).toMatchTypeOf<Quote>();
  });
  it("LibraryEntry requires bookIsbn, addedAt, position", () => {
    const e: LibraryEntry = { bookIsbn: "9788960773431", addedAt: "2026-05-12", position: 0 };
    expectTypeOf(e).toMatchTypeOf<LibraryEntry>();
  });
});
```

- [ ] **Step 2: Run — must fail (module missing)**

```bash
npm test -- tests/lib/db/types.test.ts
```
Expected: cannot resolve `@/lib/db/types`.

- [ ] **Step 3: Implement `lib/db/types.ts`**

```ts
export interface Book {
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  coverUrl?: string;
  description?: string;
  rawFromApi?: unknown;
}

export interface Quote {
  id: string;
  bookIsbn: string;
  text: string;
  page?: number;
  createdAt: string;
}

export interface LibraryEntry {
  bookIsbn: string;
  addedAt: string;
  position: number;
}
```

- [ ] **Step 4: Test passes**

```bash
npm test -- tests/lib/db/types.test.ts
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/db/types.ts tests/lib/db/types.test.ts
git commit -m "feat(db): add Book, Quote, LibraryEntry types"
```

---

## Task 7: LibraryStorage interface

**Files:**
- Create: `lib/db/storage.ts`

- [ ] **Step 1: Implement interface (no test — pure type contract)**

```ts
import type { Book, Quote, LibraryEntry } from "./types";

export interface LibraryStorage {
  listLibrary(): Promise<LibraryEntry[]>;
  addToLibrary(book: Book): Promise<LibraryEntry>;
  removeFromLibrary(isbn: string): Promise<void>;

  getBook(isbn: string): Promise<Book | null>;
  upsertBook(book: Book): Promise<void>;

  listQuotes(bookIsbn: string): Promise<Quote[]>;
  addQuote(input: Omit<Quote, "id" | "createdAt">): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/db/storage.ts
git commit -m "feat(db): add LibraryStorage interface"
```

---

## Task 8: IndexedDB implementation (TDD)

**Files:**
- Create: `lib/db/localStorage.ts`
- Test: `tests/lib/db/localStorage.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createLocalStorage } from "@/lib/db/localStorage";

describe("createLocalStorage (IndexedDB)", () => {
  let storage: ReturnType<typeof createLocalStorage>;
  beforeEach(async () => {
    storage = createLocalStorage({ namespace: `test-${Math.random()}` });
  });

  it("adds a book to library and lists it", async () => {
    await storage.addToLibrary({ isbn: "111", title: "A" });
    const entries = await storage.listLibrary();
    expect(entries).toHaveLength(1);
    expect(entries[0].bookIsbn).toBe("111");
  });

  it("persists book metadata for later retrieval", async () => {
    await storage.addToLibrary({ isbn: "222", title: "B", author: "X" });
    const book = await storage.getBook("222");
    expect(book?.title).toBe("B");
    expect(book?.author).toBe("X");
  });

  it("removes book from library", async () => {
    await storage.addToLibrary({ isbn: "333", title: "C" });
    await storage.removeFromLibrary("333");
    expect(await storage.listLibrary()).toHaveLength(0);
  });

  it("adds quotes and lists them by isbn", async () => {
    await storage.addToLibrary({ isbn: "444", title: "D" });
    const q = await storage.addQuote({ bookIsbn: "444", text: "hello" });
    expect(q.id).toBeDefined();
    expect(q.createdAt).toBeDefined();
    const list = await storage.listQuotes("444");
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe("hello");
  });

  it("deletes a quote by id", async () => {
    await storage.addToLibrary({ isbn: "555", title: "E" });
    const q = await storage.addQuote({ bookIsbn: "555", text: "x" });
    await storage.deleteQuote(q.id);
    expect(await storage.listQuotes("555")).toHaveLength(0);
  });

  it("assigns increasing position to new library entries", async () => {
    await storage.addToLibrary({ isbn: "a1", title: "1" });
    await storage.addToLibrary({ isbn: "a2", title: "2" });
    const entries = await storage.listLibrary();
    expect(entries[0].position).toBe(0);
    expect(entries[1].position).toBe(1);
  });
});
```

- [ ] **Step 2: Run — must fail**

```bash
npm test -- tests/lib/db/localStorage.test.ts
```
Expected: module not found.

- [ ] **Step 3: Implement `lib/db/localStorage.ts`**

```ts
import { createStore, get, set, del, keys } from "idb-keyval";
import { v4 as uuid } from "uuid";
import type { Book, Quote, LibraryEntry } from "./types";
import type { LibraryStorage } from "./storage";

interface Options { namespace?: string; }

export function createLocalStorage(opts: Options = {}): LibraryStorage {
  const ns = opts.namespace ?? "bookshelf";
  const books = createStore(`${ns}-books-db`, "books");
  const entries = createStore(`${ns}-entries-db`, "entries");
  const quotes = createStore(`${ns}-quotes-db`, "quotes");

  return {
    async listLibrary() {
      const isbns = (await keys(entries)) as string[];
      const list = await Promise.all(
        isbns.map((isbn) => get<LibraryEntry>(isbn, entries))
      );
      return list.filter((x): x is LibraryEntry => !!x).sort((a, b) => a.position - b.position);
    },

    async addToLibrary(book) {
      await set(book.isbn, book, books);
      const existing = await get<LibraryEntry>(book.isbn, entries);
      if (existing) return existing;
      const count = (await keys(entries)).length;
      const entry: LibraryEntry = { bookIsbn: book.isbn, addedAt: new Date().toISOString(), position: count };
      await set(book.isbn, entry, entries);
      return entry;
    },

    async removeFromLibrary(isbn) {
      await del(isbn, entries);
    },

    async getBook(isbn) {
      return (await get<Book>(isbn, books)) ?? null;
    },

    async upsertBook(book) {
      await set(book.isbn, book, books);
    },

    async listQuotes(bookIsbn) {
      const all = await keys(quotes);
      const list = await Promise.all(all.map((k) => get<Quote>(k as string, quotes)));
      return list
        .filter((q): q is Quote => !!q && q.bookIsbn === bookIsbn)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async addQuote(input) {
      const q: Quote = { id: uuid(), createdAt: new Date().toISOString(), ...input };
      await set(q.id, q, quotes);
      return q;
    },

    async deleteQuote(id) {
      await del(id, quotes);
    },
  };
}
```

- [ ] **Step 4: Tests pass**

```bash
npm test -- tests/lib/db/localStorage.test.ts
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/db/localStorage.ts tests/lib/db/localStorage.test.ts
git commit -m "feat(db): IndexedDB-backed LibraryStorage implementation (TDD)"
```

---

## Task 9: Supabase storage implementation

**Files:**
- Create: `lib/auth/supabase.ts`
- Create: `lib/db/supabaseStorage.ts`
- Test: `tests/lib/db/supabaseStorage.test.ts`

- [ ] **Step 1: Browser client**

Create `lib/auth/supabase.ts`:
```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase env vars are not configured");
  }
  cached = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}
```

- [ ] **Step 2: Failing tests with mock client**

Create `tests/lib/db/supabaseStorage.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { createSupabaseStorage } from "@/lib/db/supabaseStorage";

function makeMockClient() {
  const tables: Record<string, any[]> = { books: [], library_entries: [], quotes: [] };
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    from(name: string) {
      return {
        select: vi.fn().mockImplementation(() => ({
          eq: (_: string, val: string) => ({
            order: () => Promise.resolve({ data: tables[name].filter((r) => r.user_id === val || r.book_isbn === val), error: null }),
            single: () => Promise.resolve({ data: tables[name].find((r) => r.isbn === val) ?? null, error: null }),
          }),
        })),
        upsert: vi.fn().mockImplementation((row) => {
          const arr = Array.isArray(row) ? row : [row];
          tables[name].push(...arr);
          return Promise.resolve({ data: arr, error: null });
        }),
        insert: vi.fn().mockImplementation((row) => {
          const r = Array.isArray(row) ? row[0] : row;
          tables[name].push(r);
          return { select: () => ({ single: () => Promise.resolve({ data: r, error: null }) }) };
        }),
        delete: vi.fn().mockImplementation(() => ({
          eq: () => Promise.resolve({ error: null }),
        })),
      };
    },
    __tables: tables,
  } as any;
}

describe("createSupabaseStorage", () => {
  it("addToLibrary upserts book and inserts entry", async () => {
    const client = makeMockClient();
    const storage = createSupabaseStorage(client);
    await storage.addToLibrary({ isbn: "111", title: "A" });
    expect(client.__tables.books).toHaveLength(1);
    expect(client.__tables.library_entries).toHaveLength(1);
  });

  it("addQuote returns row with id and createdAt", async () => {
    const client = makeMockClient();
    const storage = createSupabaseStorage(client);
    const q = await storage.addQuote({ bookIsbn: "111", text: "hi" });
    expect(q.id).toBeDefined();
    expect(q.createdAt).toBeDefined();
  });
});
```

- [ ] **Step 3: Run — fail**

```bash
npm test -- tests/lib/db/supabaseStorage.test.ts
```
Expected: module not found.

- [ ] **Step 4: Implement `lib/db/supabaseStorage.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import type { Book, Quote, LibraryEntry } from "./types";
import type { LibraryStorage } from "./storage";

export function createSupabaseStorage(client: SupabaseClient): LibraryStorage {
  async function userId(): Promise<string> {
    const { data } = await client.auth.getUser();
    const id = data.user?.id;
    if (!id) throw new Error("Not authenticated");
    return id;
  }

  return {
    async listLibrary() {
      const uid = await userId();
      const { data, error } = await client
        .from("library_entries")
        .select("*")
        .eq("user_id", uid)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any): LibraryEntry => ({
        bookIsbn: r.book_isbn,
        addedAt: r.added_at,
        position: r.position,
      }));
    },

    async addToLibrary(book) {
      const uid = await userId();
      await client.from("books").upsert({
        isbn: book.isbn,
        title: book.title,
        author: book.author ?? null,
        publisher: book.publisher ?? null,
        cover_url: book.coverUrl ?? null,
        description: book.description ?? null,
      });
      const { data: existing } = await client
        .from("library_entries")
        .select("*")
        .eq("user_id", uid);
      const position = (existing ?? []).length;
      const row = { user_id: uid, book_isbn: book.isbn, added_at: new Date().toISOString(), position };
      await client.from("library_entries").insert(row);
      return { bookIsbn: book.isbn, addedAt: row.added_at, position };
    },

    async removeFromLibrary(isbn) {
      const uid = await userId();
      await client.from("library_entries").delete().eq("user_id", uid).eq("book_isbn", isbn);
    },

    async getBook(isbn) {
      const { data } = await client.from("books").select("*").eq("isbn", isbn).single();
      if (!data) return null;
      return {
        isbn: data.isbn,
        title: data.title,
        author: data.author ?? undefined,
        publisher: data.publisher ?? undefined,
        coverUrl: data.cover_url ?? undefined,
        description: data.description ?? undefined,
      };
    },

    async upsertBook(book) {
      await client.from("books").upsert({
        isbn: book.isbn,
        title: book.title,
        author: book.author ?? null,
        publisher: book.publisher ?? null,
        cover_url: book.coverUrl ?? null,
        description: book.description ?? null,
      });
    },

    async listQuotes(bookIsbn) {
      const uid = await userId();
      const { data, error } = await client
        .from("quotes")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => r.book_isbn === bookIsbn)
        .map((r: any): Quote => ({ id: r.id, bookIsbn: r.book_isbn, text: r.text, page: r.page ?? undefined, createdAt: r.created_at }));
    },

    async addQuote(input) {
      const uid = await userId();
      const row = {
        id: uuid(),
        user_id: uid,
        book_isbn: input.bookIsbn,
        text: input.text,
        page: input.page ?? null,
        created_at: new Date().toISOString(),
      };
      const { data } = await client.from("quotes").insert(row).select().single();
      return { id: data.id, bookIsbn: data.book_isbn, text: data.text, page: data.page ?? undefined, createdAt: data.created_at };
    },

    async deleteQuote(id) {
      await client.from("quotes").delete().eq("id", id);
    },
  };
}
```

- [ ] **Step 5: Tests pass**

```bash
npm test -- tests/lib/db/supabaseStorage.test.ts
```
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/supabase.ts lib/db/supabaseStorage.ts tests/lib/db/supabaseStorage.test.ts
git commit -m "feat(db): Supabase-backed LibraryStorage + browser client"
```

---

## Task 10: Storage factory + migration

**Files:**
- Create: `lib/db/index.ts`
- Create: `lib/db/migrate.ts`
- Test: `tests/lib/db/migrate.test.ts`

- [ ] **Step 1: Write failing migration test**

Create `tests/lib/db/migrate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createLocalStorage } from "@/lib/db/localStorage";
import { migrateLocalToCloud } from "@/lib/db/migrate";
import type { LibraryStorage } from "@/lib/db/storage";

function makeMemoryCloud(): LibraryStorage & { entries: any[]; quotes: any[] } {
  const entries: any[] = [], quotes: any[] = [], books: any[] = [];
  return {
    listLibrary: async () => entries.map((e) => ({ bookIsbn: e.bookIsbn, addedAt: e.addedAt, position: e.position })),
    addToLibrary: async (b) => { books.push(b); const e = { bookIsbn: b.isbn, addedAt: new Date().toISOString(), position: entries.length }; entries.push(e); return e; },
    removeFromLibrary: async () => {},
    getBook: async () => null,
    upsertBook: async (b) => { books.push(b); },
    listQuotes: async (isbn) => quotes.filter((q) => q.bookIsbn === isbn),
    addQuote: async (q) => { const row = { ...q, id: String(quotes.length), createdAt: new Date().toISOString() }; quotes.push(row); return row; },
    deleteQuote: async () => {},
    entries, quotes,
  };
}

describe("migrateLocalToCloud", () => {
  it("copies all library entries and quotes from local to cloud", async () => {
    const local = createLocalStorage({ namespace: `mig-${Math.random()}` });
    await local.addToLibrary({ isbn: "1", title: "A" });
    await local.addToLibrary({ isbn: "2", title: "B" });
    await local.addQuote({ bookIsbn: "1", text: "q1" });

    const cloud = makeMemoryCloud();
    const result = await migrateLocalToCloud(local, cloud);

    expect(cloud.entries).toHaveLength(2);
    expect(cloud.quotes).toHaveLength(1);
    expect(result.booksMigrated).toBe(2);
    expect(result.quotesMigrated).toBe(1);
  });

  it("is idempotent — running twice does not duplicate", async () => {
    const local = createLocalStorage({ namespace: `mig2-${Math.random()}` });
    await local.addToLibrary({ isbn: "1", title: "A" });
    const cloud = makeMemoryCloud();
    await migrateLocalToCloud(local, cloud);
    await migrateLocalToCloud(local, cloud);
    expect(cloud.entries.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
npm test -- tests/lib/db/migrate.test.ts
```
Expected: module not found.

- [ ] **Step 3: Implement `lib/db/migrate.ts`**

```ts
import type { LibraryStorage } from "./storage";

export interface MigrationResult {
  booksMigrated: number;
  quotesMigrated: number;
}

export async function migrateLocalToCloud(
  local: LibraryStorage,
  cloud: LibraryStorage,
): Promise<MigrationResult> {
  const entries = await local.listLibrary();
  const cloudEntries = await cloud.listLibrary();
  const cloudIsbns = new Set(cloudEntries.map((e) => e.bookIsbn));

  let books = 0;
  let quotes = 0;

  for (const entry of entries) {
    if (cloudIsbns.has(entry.bookIsbn)) continue;
    const book = await local.getBook(entry.bookIsbn);
    if (!book) continue;
    await cloud.addToLibrary(book);
    books += 1;

    const localQuotes = await local.listQuotes(entry.bookIsbn);
    const cloudQuotes = await cloud.listQuotes(entry.bookIsbn);
    const existing = new Set(cloudQuotes.map((q) => q.text + "|" + (q.page ?? "")));
    for (const q of localQuotes) {
      const fingerprint = q.text + "|" + (q.page ?? "");
      if (existing.has(fingerprint)) continue;
      await cloud.addQuote({ bookIsbn: q.bookIsbn, text: q.text, page: q.page });
      quotes += 1;
    }
  }

  return { booksMigrated: books, quotesMigrated: quotes };
}
```

- [ ] **Step 4: Implement `lib/db/index.ts` (factory)**

```ts
import type { Session } from "@supabase/supabase-js";
import { createLocalStorage } from "./localStorage";
import { createSupabaseStorage } from "./supabaseStorage";
import { getSupabaseBrowserClient } from "../auth/supabase";
import type { LibraryStorage } from "./storage";

export function getStorage(session: Session | null): LibraryStorage {
  if (session) {
    return createSupabaseStorage(getSupabaseBrowserClient());
  }
  return createLocalStorage();
}

export { migrateLocalToCloud } from "./migrate";
export type { LibraryStorage } from "./storage";
export type { Book, Quote, LibraryEntry } from "./types";
```

- [ ] **Step 5: Tests pass**

```bash
npm test -- tests/lib/db
```
Expected: all green (types + localStorage + supabaseStorage + migrate).

- [ ] **Step 6: Commit**

```bash
git add lib/db/index.ts lib/db/migrate.ts tests/lib/db/migrate.test.ts
git commit -m "feat(db): storage factory + idempotent local->cloud migration"
```

---

## Task 11: Extend utils/api.ts with fetchBookByIsbn

**Files:**
- Modify: `utils/api.ts`
- Test: `tests/utils/api.test.ts`

- [ ] **Step 1: Write failing test (axios mocked)**

Create `tests/utils/api.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios", () => {
  const get = vi.fn();
  return { default: { create: () => ({ get }), get } };
});

beforeEach(() => vi.resetModules());

describe("fetchBookByIsbn", () => {
  it("returns mapped Book when API has a result", async () => {
    const { fetchBookByIsbn } = await import("@/utils/api");
    (axios as any).create().get.mockResolvedValueOnce({
      data: { result: [{ titleInfo: "이방인", authorInfo: "알베르 카뮈", pubInfo: "민음사", imageUrl: "https://x/y.jpg", isbn: "9788960773431" }] },
    });
    const book = await fetchBookByIsbn("9788960773431");
    expect(book).toEqual({
      isbn: "9788960773431",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      coverUrl: "https://x/y.jpg",
      rawFromApi: expect.any(Object),
    });
  });

  it("returns null when API returns empty result", async () => {
    const { fetchBookByIsbn } = await import("@/utils/api");
    (axios as any).create().get.mockResolvedValueOnce({ data: { result: [] } });
    expect(await fetchBookByIsbn("000")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
npm test -- tests/utils/api.test.ts
```
Expected: `fetchBookByIsbn` is not a function.

- [ ] **Step 3: Extend `utils/api.ts`**

Append below the existing `fetchBooks` export:
```ts
import type { Book } from "@/lib/db/types";

function mapApiBook(raw: any): Book {
  return {
    isbn: String(raw.isbn ?? ""),
    title: String(raw.titleInfo ?? raw.title ?? ""),
    author: raw.authorInfo ?? raw.author ?? undefined,
    publisher: raw.pubInfo ?? raw.publisher ?? undefined,
    coverUrl: raw.imageUrl ?? raw.coverUrl ?? undefined,
    description: raw.description ?? undefined,
    rawFromApi: raw,
  };
}

export async function fetchBookByIsbn(isbn: string): Promise<Book | null> {
  try {
    const { data } = await api.get("?systemType=오프라인자료", {
      params: { srchTarget: "isbn", kwd: isbn, apiType: "json", category: "도서" },
    });
    const raw = data?.result?.[0];
    return raw ? mapApiBook(raw) : null;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    throw error;
  }
}

export async function searchBooks(keyword: string): Promise<Book[]> {
  const data = await fetchBooks("title", keyword);
  const raws = data?.result ?? [];
  return raws.map(mapApiBook);
}
```

- [ ] **Step 4: Tests pass**

```bash
npm test -- tests/utils/api.test.ts
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add utils/api.ts tests/utils/api.test.ts
git commit -m "feat(api): add fetchBookByIsbn + searchBooks helpers with mapping"
```

---

## Task 12: UI primitives — Button + IconButton (TDD)

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/IconButton.tsx`
- Test: `tests/components/ui/Button.test.tsx`

- [ ] **Step 1: Failing test**

Create `tests/components/ui/Button.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>담기</Button>);
    await userEvent.click(screen.getByRole("button", { name: "담기" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("primary variant uses Pinterest Red bg class", () => {
    render(<Button variant="primary">CTA</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");
  });

  it("secondary variant uses secondary-bg", () => {
    render(<Button variant="secondary">cancel</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-secondary-bg");
  });

  it("disabled state prevents click", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>x</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
npm test -- tests/components/ui/Button.test.tsx
```
Expected: cannot find module.

- [ ] **Step 3: Implement `components/ui/Button.tsx`**

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "tertiary";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary: "bg-primary text-canvas active:bg-primary-pressed",
  secondary: "bg-secondary-bg text-ink active:bg-secondary-pressed",
  tertiary: "bg-transparent text-ink",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center h-10 px-md rounded-md text-button-md disabled:bg-surface-card disabled:text-ash ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 4: Implement `components/ui/IconButton.tsx`**

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-card text-ink ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 5: Tests pass**

```bash
npm test -- tests/components/ui/Button.test.tsx
```
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add components/ui/Button.tsx components/ui/IconButton.tsx tests/components/ui/Button.test.tsx
git commit -m "feat(ui): Button + IconButton primitives per DESIGN.md"
```

---

## Task 13: UI primitives — Input, SearchBar, Modal

**Files:**
- Create: `components/ui/Input.tsx`, `components/ui/SearchBar.tsx`, `components/ui/Modal.tsx`
- Test: `tests/components/ui/Modal.test.tsx`

- [ ] **Step 1: Failing Modal test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders children when open=true", () => {
    render(<Modal open onClose={() => {}}>inside</Modal>);
    expect(screen.getByText("inside")).toBeInTheDocument();
  });
  it("renders nothing when open=false", () => {
    render(<Modal open={false} onClose={() => {}}>inside</Modal>);
    expect(screen.queryByText("inside")).not.toBeInTheDocument();
  });
  it("calls onClose on Escape key", async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose}>x</Modal>);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
  it("calls onClose when clicking scrim", async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose}>x</Modal>);
    await userEvent.click(screen.getByTestId("modal-scrim"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
npm test -- tests/components/ui/Modal.test.tsx
```
Expected: cannot find module.

- [ ] **Step 3: Implement `components/ui/Modal.tsx`**

```tsx
"use client";
import { ReactNode, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}

export function Modal({ open, onClose, children, labelledBy }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div
        data-testid="modal-scrim"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <div className="relative bg-canvas rounded-lg shadow-modal max-w-md w-[calc(100%-32px)] p-xxl">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `components/ui/Input.tsx`**

```tsx
import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, id, className = "", ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-xxs">
      {label && <span className="text-body-sm-strong text-ink">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={`h-11 px-md rounded-md border border-ash bg-canvas text-body-md text-ink focus:border-ink focus:outline focus:outline-2 focus:outline-focus-outer focus:outline-offset-2 ${className}`}
        {...rest}
      />
    </label>
  );
});
```

- [ ] **Step 5: Implement `components/ui/SearchBar.tsx`**

```tsx
"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { className = "", ...rest },
  ref,
) {
  return (
    <div className={`flex items-center gap-sm h-12 px-md rounded-full bg-surface-card focus-within:bg-canvas focus-within:border focus-within:border-ash ${className}`}>
      <span aria-hidden className="text-mute" role="img">🔍</span>
      <input
        ref={ref}
        type="search"
        className="flex-1 bg-transparent outline-none text-body-md text-ink placeholder:text-ash"
        {...rest}
      />
    </div>
  );
});
```

- [ ] **Step 6: Tests pass**

```bash
npm test -- tests/components/ui
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add components/ui/Input.tsx components/ui/SearchBar.tsx components/ui/Modal.tsx tests/components/ui/Modal.test.tsx
git commit -m "feat(ui): Input, SearchBar, Modal primitives"
```

---

## Task 14: BookCard + BookGrid + EmptyState (TDD)

**Files:**
- Create: `components/library/BookCard.tsx`, `BookGrid.tsx`, `EmptyState.tsx`
- Test: `tests/components/library/BookGrid.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookGrid } from "@/components/library/BookGrid";
import type { Book } from "@/lib/db/types";

const books: Book[] = [
  { isbn: "1", title: "A", author: "X" },
  { isbn: "2", title: "B", author: "Y" },
];

describe("BookGrid", () => {
  it("renders each book card", () => {
    render(<BookGrid books={books} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
  it("uses 3-column grid via grid-cols-3 class", () => {
    const { container } = render(<BookGrid books={books} />);
    expect(container.firstChild).toHaveClass("grid-cols-3");
  });
  it("renders empty state when books is empty", () => {
    render(<BookGrid books={[]} />);
    expect(screen.getByText(/책이 아직 없어요/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement `components/library/BookCard.tsx`**

```tsx
import Link from "next/link";
import type { Book } from "@/lib/db/types";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.isbn}`}
      className="flex flex-col gap-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer rounded-md"
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-surface-card">
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ash text-caption-sm px-xs text-center">
            {book.title}
          </div>
        )}
      </div>
      <p className="text-body-sm-strong text-ink line-clamp-2">{book.title}</p>
      {book.author && <p className="text-caption-md text-mute line-clamp-1">{book.author}</p>}
    </Link>
  );
}
```

- [ ] **Step 4: Implement `components/library/EmptyState.tsx`**

```tsx
export function EmptyState() {
  return (
    <div className="col-span-3 flex flex-col items-center gap-md py-section text-center">
      <p className="text-heading-md text-ink">책이 아직 없어요</p>
      <p className="text-body-md text-mute">
        좌측 상단 + 버튼을 눌러 ISBN으로 책을 등록해보세요.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Implement `components/library/BookGrid.tsx`**

```tsx
import type { Book } from "@/lib/db/types";
import { BookCard } from "./BookCard";
import { EmptyState } from "./EmptyState";

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-3 gap-sm px-md">
      {books.length === 0 ? (
        <EmptyState />
      ) : (
        books.map((b) => <BookCard key={b.isbn} book={b} />)
      )}
    </div>
  );
}
```

- [ ] **Step 6: Tests pass**

```bash
npm test -- tests/components/library
```
Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add components/library/ tests/components/library/
git commit -m "feat(library): BookCard, BookGrid, EmptyState (3-up always)"
```

---

## Task 15: AddBookFab + AddBookSheet (TDD)

**Files:**
- Create: `components/add-book/AddBookFab.tsx`, `AddBookSheet.tsx`, `SearchResultCard.tsx`
- Test: `tests/components/add-book/AddBookSheet.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddBookSheet } from "@/components/add-book/AddBookSheet";

vi.mock("@/utils/api", () => ({
  fetchBookByIsbn: vi.fn(),
  searchBooks: vi.fn().mockResolvedValue([
    { isbn: "9788960773431", title: "이방인", author: "카뮈", publisher: "민음사" },
  ]),
}));

describe("AddBookSheet", () => {
  it("renders nothing when closed", () => {
    render(<AddBookSheet open={false} onClose={() => {}} onAdd={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("debounces search and renders results", async () => {
    render(<AddBookSheet open onClose={() => {}} onAdd={() => {}} />);
    await userEvent.type(screen.getByRole("searchbox"), "이방인");
    await waitFor(() => expect(screen.getByText("이방인")).toBeInTheDocument(), { timeout: 1000 });
  });

  it("clicking '내 서재에 담기' fires onAdd with the book", async () => {
    const onAdd = vi.fn();
    render(<AddBookSheet open onClose={() => {}} onAdd={onAdd} />);
    await userEvent.type(screen.getByRole("searchbox"), "이방인");
    const btn = await screen.findByRole("button", { name: "내 서재에 담기" });
    await userEvent.click(btn);
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ isbn: "9788960773431" }));
  });
});
```

- [ ] **Step 2: Implement `components/add-book/SearchResultCard.tsx`**

```tsx
import { Button } from "@/components/ui/Button";
import type { Book } from "@/lib/db/types";

export function SearchResultCard({ book, onAdd }: { book: Book; onAdd: (b: Book) => void }) {
  return (
    <div className="flex gap-md p-md rounded-md bg-surface-card">
      <div className="w-16 h-24 rounded-sm bg-canvas overflow-hidden flex-shrink-0">
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-xxs">
        <p className="text-body-strong text-ink line-clamp-2">{book.title}</p>
        {book.author && <p className="text-body-sm text-mute">{book.author}</p>}
        {book.publisher && <p className="text-caption-md text-mute">{book.publisher}</p>}
      </div>
      <Button variant="primary" onClick={() => onAdd(book)}>내 서재에 담기</Button>
    </div>
  );
}
```

- [ ] **Step 3: Implement `components/add-book/AddBookSheet.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { SearchResultCard } from "./SearchResultCard";
import { searchBooks, fetchBookByIsbn } from "@/utils/api";
import type { Book } from "@/lib/db/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (book: Book) => void;
}

const ISBN_REGEX = /^[\d-]{10,17}$/;

export function AddBookSheet({ open, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        if (ISBN_REGEX.test(query.trim().replace(/-/g, ""))) {
          const book = await fetchBookByIsbn(query.trim().replace(/-/g, ""));
          setResults(book ? [book] : []);
        } else {
          setResults(await searchBooks(query.trim()));
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} labelledBy="add-book-title">
      <h2 id="add-book-title" className="text-heading-lg text-ink mb-lg">책 추가</h2>
      <SearchBar
        autoFocus
        placeholder="ISBN 또는 제목으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-lg flex flex-col gap-sm max-h-[60vh] overflow-y-auto">
        {loading && <p className="text-body-sm text-mute">검색 중…</p>}
        {!loading && query && results.length === 0 && (
          <p className="text-body-sm text-mute">검색 결과가 없습니다.</p>
        )}
        {results.map((b) => (
          <SearchResultCard key={b.isbn} book={b} onAdd={(book) => { onAdd(book); onClose(); }} />
        ))}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Implement `components/add-book/AddBookFab.tsx`**

```tsx
"use client";
import { IconButton } from "@/components/ui/IconButton";

export function AddBookFab({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="책 추가" onClick={onClick} className="text-ink">
      <span aria-hidden className="text-[20px] leading-none">+</span>
    </IconButton>
  );
}
```

- [ ] **Step 5: Tests pass**

```bash
npm test -- tests/components/add-book
```
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add components/add-book/ tests/components/add-book/
git commit -m "feat(add-book): AddBookFab + AddBookSheet with debounced search and ISBN detection"
```

---

## Task 16: AuthProvider + AuthModal + ProfileChip

**Files:**
- Create: `components/auth/AuthProvider.tsx`, `AuthModal.tsx`, `ProfileChip.tsx`

- [ ] **Step 1: Implement `components/auth/AuthProvider.tsx`**

```tsx
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    try {
      const client = getSupabaseBrowserClient();
      client.auth.getSession().then(({ data }) => {
        if (!cancelled) {
          setSession(data.session);
          setLoading(false);
        }
      });
      const sub = client.auth.onAuthStateChange((_e, s) => setSession(s));
      return () => { cancelled = true; sub.data.subscription.unsubscribe(); };
    } catch {
      // env not configured — guest mode only
      setLoading(false);
    }
  }, []);

  const value: AuthState = {
    session,
    loading,
    signInWithGoogle: async () => {
      const client = getSupabaseBrowserClient();
      await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
    },
    signInWithEmail: async (email, password) => {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signUpWithEmail: async (email, password) => {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.signUp({ email, password });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      const client = getSupabaseBrowserClient();
      await client.auth.signOut();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
```

- [ ] **Step 2: Implement `components/auth/AuthModal.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "./AuthProvider";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const fn = mode === "signin" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) setError(error);
    else onClose();
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="auth-title">
      <h2 id="auth-title" className="text-heading-lg text-ink">환영합니다</h2>
      <p className="mt-xxs text-body-md text-mute">
        {mode === "signin" ? "내 서재로 다시 들어오세요." : "계정을 만들고 내 서재를 시작하세요."}
      </p>
      <form className="mt-xl flex flex-col gap-md" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Input label="이메일" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="비밀번호" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-body-sm text-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" disabled={busy}>{mode === "signin" ? "로그인" : "계정 만들기"}</Button>
      </form>
      <div className="mt-md flex flex-col gap-sm">
        <Button variant="secondary" onClick={signInWithGoogle}>Google로 계속</Button>
        <button
          type="button"
          className="text-body-sm text-ink-soft underline"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "처음이신가요? 계정 만들기" : "이미 계정이 있나요? 로그인"}
        </button>
        <button
          type="button"
          className="text-body-sm text-mute"
          onClick={onClose}
        >
          게스트로 둘러보기
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Implement `components/auth/ProfileChip.tsx`**

```tsx
"use client";
import { useAuth } from "./AuthProvider";

export function ProfileChip({ onSignInClick }: { onSignInClick: () => void }) {
  const { session, signOut } = useAuth();
  if (!session) {
    return (
      <button onClick={onSignInClick} className="text-button-md text-ink">로그인</button>
    );
  }
  const initial = (session.user.email ?? "?")[0]?.toUpperCase();
  return (
    <div className="flex items-center gap-sm">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-card text-body-strong text-ink">{initial}</span>
      <button onClick={signOut} className="text-caption-md text-mute">로그아웃</button>
    </div>
  );
}
```

- [ ] **Step 4: Add provider to layout**

Edit `app/layout.tsx` body to wrap children:
```tsx
import { AuthProvider } from "@/components/auth/AuthProvider";
// ...
<body className="min-h-screen bg-canvas text-body antialiased">
  <AuthProvider>{children}</AuthProvider>
</body>
```

- [ ] **Step 5: Auth callback route**

Create `app/auth/callback/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
export function GET(req: NextRequest) {
  // Supabase exchanges the code client-side via detectSessionInUrl;
  // server-side just redirects home.
  return NextResponse.redirect(new URL("/", req.url));
}
```

- [ ] **Step 6: Verify typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add components/auth/ app/layout.tsx app/auth/
git commit -m "feat(auth): Supabase AuthProvider, AuthModal, ProfileChip + OAuth callback"
```

---

## Task 17: LibraryView (compose home page) + migration hook

**Files:**
- Create: `components/library/LibraryView.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement `components/library/LibraryView.tsx`**

```tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileChip } from "@/components/auth/ProfileChip";
import { AddBookFab } from "@/components/add-book/AddBookFab";
import { AddBookSheet } from "@/components/add-book/AddBookSheet";
import { BookGrid } from "./BookGrid";
import { createLocalStorage } from "@/lib/db/localStorage";
import { createSupabaseStorage } from "@/lib/db/supabaseStorage";
import { migrateLocalToCloud } from "@/lib/db/migrate";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase";
import type { Book } from "@/lib/db/types";
import type { LibraryStorage } from "@/lib/db/storage";

export function LibraryView() {
  const { session, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const migratedFor = useRef<string | null>(null);

  function pickStorage(): LibraryStorage {
    if (session) return createSupabaseStorage(getSupabaseBrowserClient());
    return createLocalStorage();
  }

  async function reload(storage: LibraryStorage) {
    const entries = await storage.listLibrary();
    const list = await Promise.all(entries.map((e) => storage.getBook(e.bookIsbn)));
    setBooks(list.filter((b): b is Book => !!b));
  }

  useEffect(() => {
    if (loading) return;
    const storage = pickStorage();

    (async () => {
      if (session && migratedFor.current !== session.user.id) {
        try {
          const local = createLocalStorage();
          await migrateLocalToCloud(local, storage);
          migratedFor.current = session.user.id;
        } catch (e) {
          console.warn("migration skipped:", e);
        }
      }
      await reload(storage);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, loading]);

  async function handleAdd(book: Book) {
    const storage = pickStorage();
    await storage.addToLibrary(book);
    await reload(storage);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-md py-md">
        <div className="flex items-center gap-sm">
          <AddBookFab onClick={() => setAddOpen(true)} />
          <h1 className="text-heading-lg text-ink">내 서재</h1>
        </div>
        <ProfileChip onSignInClick={() => setAuthOpen(true)} />
      </header>

      <main className="flex-1 pb-section">
        <BookGrid books={books} />
      </main>

      <AddBookSheet open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `app/page.tsx`**

```tsx
import { LibraryView } from "@/components/library/LibraryView";

export default function HomePage() {
  return <LibraryView />;
}
```

- [ ] **Step 3: Remove dead dashboard stub**

```bash
rm -rf app/dashboard
```

- [ ] **Step 4: Build smoke test**

```bash
npm run build
```
Expected: build succeeds (warnings OK, errors not).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/dashboard components/library/LibraryView.tsx
git commit -m "feat(library): LibraryView composes home page with auth-aware storage + migration"
```

---

## Task 18: Book Detail page + QuoteList + QuoteAddSheet

**Files:**
- Create: `app/book/[isbn]/page.tsx`
- Create: `components/book-detail/BookDetailHero.tsx`, `QuoteList.tsx`, `QuoteAddSheet.tsx`, `BookDetailView.tsx`

- [ ] **Step 1: `components/book-detail/BookDetailHero.tsx`**

```tsx
import type { Book } from "@/lib/db/types";

export function BookDetailHero({ book }: { book: Book }) {
  return (
    <section className="flex flex-col items-center gap-lg px-md pt-xl">
      <div className="w-40 aspect-[2/3] rounded-lg overflow-hidden bg-surface-card">
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="text-center">
        <h1 className="text-heading-xl text-ink">{book.title}</h1>
        {book.author && <p className="mt-xs text-body-md text-mute">{book.author}</p>}
        {book.publisher && <p className="text-body-sm text-mute">{book.publisher}</p>}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `components/book-detail/QuoteList.tsx`**

```tsx
import type { Quote } from "@/lib/db/types";
import { QuoteCardCapture } from "./QuoteCardCapture";

export function QuoteList({ quotes, bookTitle }: { quotes: Quote[]; bookTitle: string }) {
  if (quotes.length === 0) {
    return <p className="text-body-md text-mute text-center py-xl">기억하고 싶은 구절을 추가해보세요.</p>;
  }
  return (
    <ul className="flex flex-col gap-md">
      {quotes.map((q) => (
        <li key={q.id} className="bg-surface-card rounded-md p-lg">
          <QuoteCardCapture quote={q} bookTitle={bookTitle} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: `components/book-detail/QuoteCardCapture.tsx`** (TDD — see Task 19)

Stub for now:
```tsx
"use client";
import type { Quote } from "@/lib/db/types";

export function QuoteCardCapture({ quote, bookTitle }: { quote: Quote; bookTitle: string }) {
  return (
    <div>
      <blockquote className="text-body-md text-ink whitespace-pre-line">"{quote.text}"</blockquote>
      <p className="mt-xs text-caption-md text-mute">— {bookTitle}</p>
    </div>
  );
}
```

- [ ] **Step 4: `components/book-detail/QuoteAddSheet.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, page?: number) => void | Promise<void>;
}

export function QuoteAddSheet({ open, onClose, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  return (
    <Modal open={open} onClose={onClose} labelledBy="quote-add-title">
      <h2 id="quote-add-title" className="text-heading-lg text-ink mb-lg">구절 추가</h2>
      <form
        className="flex flex-col gap-md"
        onSubmit={async (e) => { e.preventDefault(); await onSubmit(text, page ? Number(page) : undefined); setText(""); setPage(""); onClose(); }}
      >
        <label className="flex flex-col gap-xxs">
          <span className="text-body-sm-strong text-ink">구절</span>
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="px-md py-sm rounded-md border border-ash bg-canvas text-body-md text-ink focus:border-ink focus:outline focus:outline-2 focus:outline-focus-outer focus:outline-offset-2"
          />
        </label>
        <Input label="페이지 (선택)" type="number" value={page} onChange={(e) => setPage(e.target.value)} />
        <Button type="submit" variant="primary">추가</Button>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 5: `components/book-detail/BookDetailView.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createLocalStorage } from "@/lib/db/localStorage";
import { createSupabaseStorage } from "@/lib/db/supabaseStorage";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase";
import type { Book, Quote } from "@/lib/db/types";
import type { LibraryStorage } from "@/lib/db/storage";
import { BookDetailHero } from "./BookDetailHero";
import { QuoteList } from "./QuoteList";
import { QuoteAddSheet } from "./QuoteAddSheet";
import { Button } from "@/components/ui/Button";

export function BookDetailView({ isbn }: { isbn: string }) {
  const { session } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [open, setOpen] = useState(false);

  function pick(): LibraryStorage {
    return session ? createSupabaseStorage(getSupabaseBrowserClient()) : createLocalStorage();
  }

  async function reload() {
    const storage = pick();
    setBook(await storage.getBook(isbn));
    setQuotes(await storage.listQuotes(isbn));
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [session?.user.id, isbn]);

  if (!book) {
    return <div className="p-md text-body-md text-mute">불러오는 중…</div>;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-md py-md">
        <Link href="/" className="text-button-md text-ink">← 내 서재</Link>
      </header>
      <BookDetailHero book={book} />
      <div className="px-md pt-xl flex justify-center">
        <Button variant="primary" onClick={() => setOpen(true)}>구절 추가</Button>
      </div>
      <section className="px-md pt-xl pb-section">
        <QuoteList quotes={quotes} bookTitle={book.title} />
      </section>
      <QuoteAddSheet
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async (text, page) => {
          await pick().addQuote({ bookIsbn: isbn, text, page });
          await reload();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: `app/book/[isbn]/page.tsx`**

```tsx
import { BookDetailView } from "@/components/book-detail/BookDetailView";

export default async function BookDetailPage({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = await params;
  return <BookDetailView isbn={isbn} />;
}
```

- [ ] **Step 7: Build smoke test**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add app/book components/book-detail/
git commit -m "feat(book-detail): BookDetailHero, QuoteList, QuoteAddSheet wired to storage"
```

---

## Task 19: QuoteCardCapture (html2canvas, TDD)

**Files:**
- Modify: `components/book-detail/QuoteCardCapture.tsx`
- Test: `tests/components/book-detail/QuoteCardCapture.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuoteCardCapture } from "@/components/book-detail/QuoteCardCapture";

const downloadSpy = vi.fn();
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,XXX",
  }),
}));

beforeEach(() => {
  // shim anchor download
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const el = origCreate(tag) as any;
    if (tag === "a") {
      el.click = () => downloadSpy(el.download, el.href);
    }
    return el;
  });
  downloadSpy.mockReset();
});

describe("QuoteCardCapture", () => {
  it("renders the quote text and book title", () => {
    render(<QuoteCardCapture quote={{ id: "1", bookIsbn: "x", text: "안녕", createdAt: "2026-05-12" }} bookTitle="이방인" />);
    expect(screen.getByText(/안녕/)).toBeInTheDocument();
    expect(screen.getByText(/이방인/)).toBeInTheDocument();
  });

  it("triggers PNG download on share click", async () => {
    render(<QuoteCardCapture quote={{ id: "1", bookIsbn: "x", text: "hi", createdAt: "2026-05-12" }} bookTitle="A" />);
    await userEvent.click(screen.getByRole("button", { name: /PNG/ }));
    expect(downloadSpy).toHaveBeenCalledWith(expect.stringMatching(/quote.*\.png/), expect.stringContaining("data:image/png"));
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement `components/book-detail/QuoteCardCapture.tsx`**

```tsx
"use client";
import { useRef } from "react";
import html2canvas from "html2canvas";
import type { Quote } from "@/lib/db/types";

export function QuoteCardCapture({ quote, bookTitle }: { quote: Quote; bookTitle: string }) {
  const ref = useRef<HTMLDivElement>(null);

  async function share() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { backgroundColor: "#fbfbf9", scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `quote-${quote.id.slice(0, 8)}.png`;
    a.click();
  }

  return (
    <div>
      <div ref={ref} className="bg-surface-soft rounded-md p-lg flex flex-col gap-sm">
        <blockquote className="text-body-md text-ink whitespace-pre-line">"{quote.text}"</blockquote>
        <p className="text-caption-md text-mute">— {bookTitle}</p>
      </div>
      <div className="mt-sm flex justify-end">
        <button
          type="button"
          onClick={share}
          className="text-button-md text-ink underline"
        >
          공유 (PNG 저장)
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Tests pass**

```bash
npm test -- tests/components/book-detail
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add components/book-detail/QuoteCardCapture.tsx tests/components/book-detail/
git commit -m "feat(book-detail): QuoteCardCapture exports PNG via html2canvas"
```

---

## Task 20: PWA manifest + service worker

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/192.png`, `public/icons/512.png`, `public/icons/maskable.png`
- Modify: `next.config.ts`

- [ ] **Step 1: Install PWA toolkit**

```bash
npm install -D @serwist/next serwist
```

- [ ] **Step 2: Create `public/manifest.webmanifest`**

```json
{
  "name": "The Ones I Read",
  "short_name": "Bookshelf",
  "description": "Your personal electronic bookshelf",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#e60023",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 3: Export icons from Pencil**

Use `mcp__pencil__export_nodes` from the Pencil file (Task 5) to render a `📚` glyph on Pinterest Red `#e60023` background. Export 192×192, 512×512, and 512×512 maskable variants into `public/icons/`.

- [ ] **Step 4: Create service worker `app/sw.ts`**

```ts
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});
```

- [ ] **Step 5: Update `next.config.ts`**

```ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {};
export default withSerwist(nextConfig);
```

- [ ] **Step 6: Build verification**

```bash
npm run build
```
Expected: build emits `public/sw.js`. Manifest accessible.

- [ ] **Step 7: Commit**

```bash
git add public/manifest.webmanifest public/icons app/sw.ts next.config.ts package.json package-lock.json
git commit -m "feat(pwa): add manifest, icons, and serwist service worker"
```

---

## Task 21: Env example + cleanup

**Files:**
- Create: `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.local.example`**

```
# Korean library/book search API (existing — needed for ISBN lookup)
NEXT_PUBLIC_API_URL=https://example.com/api
NEXT_PUBLIC_API_KEY=your-api-key

# Supabase (Auth + Postgres)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 2: Update `.gitignore`**

Append at the end:
```
# coverage
/coverage

# Pencil binaries are kept (small) but lock files ignored
.pencil/
```

- [ ] **Step 3: Verify lint + typecheck + tests pass**

```bash
npm run lint && npm run typecheck && npm test
```
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: add env template and tidy gitignore"
```

---

## Task 22: Supabase schema migration file

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Create migration**

```sql
-- supabase/migrations/0001_init.sql
create table if not exists public.books (
  isbn text primary key,
  title text not null,
  author text,
  publisher text,
  cover_url text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.library_entries (
  user_id uuid references auth.users on delete cascade not null,
  book_isbn text references public.books on delete cascade not null,
  added_at timestamptz default now(),
  position int not null default 0,
  primary key (user_id, book_isbn)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  book_isbn text references public.books on delete cascade not null,
  text text not null,
  page int,
  created_at timestamptz default now()
);

alter table public.library_entries enable row level security;
alter table public.quotes enable row level security;
alter table public.books enable row level security;

create policy "own library entries" on public.library_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own quotes" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "books readable" on public.books for select using (true);
create policy "books writable by authenticated" on public.books for insert
  with check (auth.role() = 'authenticated');
create policy "books updatable by authenticated" on public.books for update
  using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations
git commit -m "feat(supabase): initial schema migration with RLS policies"
```

---

## Task 23: README rewrite with design summary + screenshots

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write README**

```md
# The Ones I Read 📚

A personal electronic bookshelf — collect books by ISBN, arrange them like a small bestseller corner, and share favorite passages as PNG cards.

![Library home](docs/design/library.png)

## Features

- **내 서재 그리드** — 한 줄에 3권, 모든 화면 크기에서 그대로. 서점에 놀러간 듯한 진열감.
- **ISBN 등록** — 좌상단 ＋ 버튼 → 제목 또는 ISBN으로 검색 → 카드에서 "내 서재에 담기".
- **책 상세 + 구절 캡처** — 좋아하는 구절을 추가하고 PNG 카드로 저장/공유.
- **게스트 → 로그인 마이그레이션** — 로그인 전엔 IndexedDB로 로컬 저장, 로그인 순간 Supabase로 자동 이전.
- **PWA** — 홈 화면 설치, 오프라인 셸 캐시. Capacitor 네이티브 wrap은 후속 PR.

## Design

본 앱은 [`DESIGN.md`](./DESIGN.md)의 Pinterest-derived 디자인 시스템을 따릅니다. 핵심:

- Pinterest Red `#e60023`는 오직 primary CTA에만
- 따뜻한 크림 뉴트럴 (`surface-card #f6f6f3`)이 책 표지 뒤로 물러섭니다
- 라디우스 어휘 3가지: 16px (대부분) / 32px (큰 카드·모달) / pill (검색바·아이콘 버튼)
- 폰트는 Pin Sans 대체로 Inter (display tier -1.2px tracking)

디자인 mockup은 [`docs/design/`](./docs/design/)에 PNG로 보관됩니다 (Pencil 원본: `lib/pencil/bookshelf.pen`).

## Architecture

```
Next.js 15 App Router (PWA via @serwist/next)
├─ app/                 ─ routes (/ · /book/[isbn] · /auth/callback)
├─ components/
│   ├─ ui/              ─ Button, IconButton, Input, SearchBar, Modal
│   ├─ library/         ─ LibraryView, BookGrid, BookCard, EmptyState
│   ├─ add-book/        ─ AddBookFab, AddBookSheet, SearchResultCard
│   ├─ book-detail/     ─ BookDetailHero, QuoteList, QuoteCardCapture
│   └─ auth/            ─ AuthProvider, AuthModal, ProfileChip
├─ lib/
│   ├─ db/              ─ LibraryStorage interface + IndexedDB / Supabase impls
│   └─ auth/            ─ Supabase browser client
└─ utils/api.ts         ─ Korean book search API + ISBN lookup
```

**핵심 원칙**: UI는 `LibraryStorage` 인터페이스에만 의존. 비로그인 = IndexedDB 구현, 로그인 = Supabase 구현. 첫 로그인 시 `migrateLocalToCloud()`로 로컬 데이터 자동 이전.

상세 설계: [`docs/superpowers/specs/2026-05-12-bookshelf-design.md`](./docs/superpowers/specs/2026-05-12-bookshelf-design.md)

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# .env.local에 API 키와 Supabase 자격증명을 채워주세요
npm run dev
```

스크립트:

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 + service worker 생성 |
| `npm test` | Vitest 단위/컴포넌트 테스트 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Tech Stack

- **Framework**: Next.js 15.5 (App Router, Turbopack), React 19, TypeScript 5 (strict)
- **Styling**: Tailwind CSS v3.4 + DESIGN.md tokens
- **State / Storage**: IndexedDB via `idb-keyval` (guest), Supabase Postgres (signed-in)
- **Auth**: Supabase (email/password + Google OAuth)
- **PWA**: `@serwist/next` for service worker + offline shell
- **Sharing**: `html2canvas` for quote card PNG export
- **Testing**: Vitest, React Testing Library, fake-indexeddb
- **Design**: Pencil (`.pen` design files) + DESIGN.md

## Roadmap

- [ ] Capacitor wrap for iOS/Android stores (후속 PR)
- [ ] 카메라 ISBN 바코드 스캔
- [ ] 드래그&드롭 정렬 (`LibraryEntry.position` 활용)
- [ ] 친구 공유 / 소셜 그래프
```

- [ ] **Step 2: Verify all linked files exist**

```bash
ls DESIGN.md docs/design/ docs/superpowers/specs/2026-05-12-bookshelf-design.md .env.local.example
```
Expected: all present.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with design summary, architecture, and screenshots"
```

---

## Task 24: Final verification

**Files:** none modified — runs only.

- [ ] **Step 1: Tests**

```bash
npm test
```
Expected: all green.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: 0 errors.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: build succeeds, `public/sw.js` exists.

- [ ] **Step 5: Capture results**

Append outputs of above 4 commands to `.feature-dev/05-verification.md`.

- [ ] **Step 6: Commit verification log**

```bash
git add .feature-dev/05-verification.md
git commit -m "chore: log Phase 6 verification results"
```

---

## Self-review

1. **Spec coverage** — every section of `docs/superpowers/specs/2026-05-12-bookshelf-design.md`:
   - §1 Architecture: covered by Tasks 6–11, 17 (factory wiring), 20 (PWA)
   - §2 Data Model: Tasks 6, 7, 8, 9, 10, 22
   - §3 Components: Tasks 12–19
   - §4 Pencil design: Task 5
   - §5 Testing: Task 1 + per-task TDD steps
   - §6 README integration: Task 23
   - §7 Env vars: Task 21
   - §8 PWA + Capacitor: Task 20 (Capacitor explicitly deferred)
   - §9 NFRs: a11y enforced via `aria-*` in components; perf via debounce (Task 15) and lazy `next/image` (could enhance later)
2. **Placeholder scan** — no TBD, no "handle errors", no "similar to Task N". Each code step shows full code.
3. **Type consistency** — `Book`/`Quote`/`LibraryEntry`/`LibraryStorage` shapes consistent across Tasks 6→18.
4. **Ambiguity** — Task 11 calls out that API field names may need adjustment after live response; this is acceptable because it's an explicit verification step inside the task (mock test passes regardless of live API shape; real mapping verified by running dev server in Phase 6).

Plan ready.
