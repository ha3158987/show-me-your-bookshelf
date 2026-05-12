import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseStorage } from "@/lib/db/supabaseStorage";

/**
 * Tiny in-memory mock of the parts of `SupabaseClient` that
 * `createSupabaseStorage` actually calls. Each `.from(table)` returns a
 * chainable builder that simulates a Postgrest table.
 *
 * Held data lives on the returned object so tests can assert directly.
 */
function makeMockClient(userId = "user-1") {
  const tables: Record<string, any[]> = {
    books: [],
    library_entries: [],
    quotes: [],
  };

  function builder(name: string) {
    let filtered = [...tables[name]];

    const chain: any = {
      select: () => chain,
      eq: (col: string, val: any) => {
        filtered = filtered.filter((row) => row[col] === val);
        return chain;
      },
      order: (col: string, opts: { ascending?: boolean } = {}) => {
        const asc = opts.ascending !== false;
        filtered = [...filtered].sort((a, b) =>
          asc ? (a[col] > b[col] ? 1 : -1) : a[col] < b[col] ? 1 : -1,
        );
        return Promise.resolve({ data: filtered, error: null });
      },
      single: () =>
        Promise.resolve({ data: filtered[0] ?? null, error: null }),
      upsert: (row: any) => {
        const rows = Array.isArray(row) ? row : [row];
        for (const r of rows) {
          const idx = tables[name].findIndex((x) => x.isbn === r.isbn);
          if (idx >= 0) tables[name][idx] = { ...tables[name][idx], ...r };
          else tables[name].push(r);
        }
        return Promise.resolve({ data: rows, error: null });
      },
      insert: (row: any) => {
        const r = Array.isArray(row) ? row[0] : row;
        tables[name].push(r);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: r, error: null }),
          }),
        };
      },
      delete: () => {
        // Accumulate AND conditions across chained .eq() calls and apply
        // them together when the chain is awaited.
        const conditions: { col: string; val: any }[] = [];
        const delChain: any = {
          eq: (col: string, val: any) => {
            conditions.push({ col, val });
            return delChain;
          },
        };
        delChain.then = (resolve: (v: any) => void) => {
          tables[name] = tables[name].filter(
            (row) => !conditions.every(({ col, val }) => row[col] === val),
          );
          resolve({ data: null, error: null });
        };
        return delChain;
      },
    };
    return chain;
  }

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: userId } } }),
    },
    from: builder,
    __tables: tables,
  } as unknown as SupabaseClient & { __tables: typeof tables };
}

describe("createSupabaseStorage", () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("addToLibrary upserts book and inserts library entry", async () => {
    const storage = createSupabaseStorage(client);
    await storage.addToLibrary({
      isbn: "111",
      title: "A",
      author: "X",
      coverUrl: "https://x/y.jpg",
    });

    expect(client.__tables.books).toHaveLength(1);
    expect(client.__tables.books[0]).toMatchObject({
      isbn: "111",
      title: "A",
      author: "X",
      cover_url: "https://x/y.jpg",
    });
    expect(client.__tables.library_entries).toHaveLength(1);
    expect(client.__tables.library_entries[0]).toMatchObject({
      user_id: "user-1",
      book_isbn: "111",
      position: 0,
    });
  });

  it("addQuote returns row with generated id and createdAt", async () => {
    const storage = createSupabaseStorage(client);
    const q = await storage.addQuote({ bookIsbn: "111", text: "hi" });

    expect(q.id).toBeDefined();
    expect(q.createdAt).toBeDefined();
    expect(q.text).toBe("hi");
    expect(q.bookIsbn).toBe("111");
    expect(client.__tables.quotes).toHaveLength(1);
  });

  it("listLibrary returns entries filtered by user, sorted by position", async () => {
    // Seed three entries for our user and one for someone else
    client.__tables.library_entries.push(
      { user_id: "user-1", book_isbn: "c", position: 2, added_at: "2026-05-12T00:00:02Z" },
      { user_id: "user-1", book_isbn: "a", position: 0, added_at: "2026-05-12T00:00:00Z" },
      { user_id: "user-1", book_isbn: "b", position: 1, added_at: "2026-05-12T00:00:01Z" },
      { user_id: "other-user", book_isbn: "x", position: 0, added_at: "2026-05-12T00:00:00Z" },
    );

    const storage = createSupabaseStorage(client);
    const entries = await storage.listLibrary();

    expect(entries.map((e) => e.bookIsbn)).toEqual(["a", "b", "c"]);
  });

  it("removeFromLibrary deletes only the current user's entry for that isbn", async () => {
    client.__tables.library_entries.push(
      { user_id: "user-1", book_isbn: "z", position: 0, added_at: "2026-05-12T00:00:00Z" },
      { user_id: "other-user", book_isbn: "z", position: 0, added_at: "2026-05-12T00:00:00Z" },
    );

    const storage = createSupabaseStorage(client);
    await storage.removeFromLibrary("z");

    expect(client.__tables.library_entries).toHaveLength(1);
    expect(client.__tables.library_entries[0].user_id).toBe("other-user");
  });

  it("getBook returns null when isbn is not found", async () => {
    const storage = createSupabaseStorage(client);
    expect(await storage.getBook("nope")).toBeNull();
  });

  it("getBook maps snake_case columns to camelCase fields", async () => {
    client.__tables.books.push({
      isbn: "100",
      title: "T",
      author: "A",
      publisher: "P",
      cover_url: "https://x/y.jpg",
      description: "D",
    });

    const storage = createSupabaseStorage(client);
    const book = await storage.getBook("100");

    expect(book).toEqual({
      isbn: "100",
      title: "T",
      author: "A",
      publisher: "P",
      coverUrl: "https://x/y.jpg",
      description: "D",
    });
  });

  it("listQuotes filters by bookIsbn and current user", async () => {
    client.__tables.quotes.push(
      { id: "q1", user_id: "user-1", book_isbn: "b1", text: "for b1", page: null, created_at: "2026-05-12T00:00:00Z" },
      { id: "q2", user_id: "user-1", book_isbn: "b2", text: "for b2", page: null, created_at: "2026-05-12T00:00:01Z" },
      { id: "q3", user_id: "other-user", book_isbn: "b1", text: "not mine", page: null, created_at: "2026-05-12T00:00:00Z" },
    );

    const storage = createSupabaseStorage(client);
    const quotes = await storage.listQuotes("b1");

    expect(quotes).toHaveLength(1);
    expect(quotes[0].text).toBe("for b1");
  });
});
