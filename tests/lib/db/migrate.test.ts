import { describe, it, expect } from "vitest";
import { createLocalStorage } from "@/lib/db/localStorage";
import { migrateLocalToCloud } from "@/lib/db/migrate";
import type { LibraryStorage } from "@/lib/db/storage";
import type { Book, Quote, LibraryEntry } from "@/lib/db/types";

/**
 * In-memory `LibraryStorage` used as the "cloud" target so we can inspect
 * what got migrated without touching Supabase.
 */
function makeMemoryCloud() {
  const books: Book[] = [];
  const entries: LibraryEntry[] = [];
  const quotes: Quote[] = [];

  const storage: LibraryStorage = {
    listLibrary: async () => entries.slice(),
    addToLibrary: async (b) => {
      const exists = books.find((x) => x.isbn === b.isbn);
      if (!exists) books.push(b);
      const existing = entries.find((e) => e.bookIsbn === b.isbn);
      if (existing) return existing;
      const entry: LibraryEntry = {
        bookIsbn: b.isbn,
        addedAt: new Date().toISOString(),
        position: entries.length,
      };
      entries.push(entry);
      return entry;
    },
    removeFromLibrary: async (isbn) => {
      const i = entries.findIndex((e) => e.bookIsbn === isbn);
      if (i >= 0) entries.splice(i, 1);
    },
    getBook: async (isbn) => books.find((b) => b.isbn === isbn) ?? null,
    upsertBook: async (b) => {
      const i = books.findIndex((x) => x.isbn === b.isbn);
      if (i >= 0) books[i] = b;
      else books.push(b);
    },
    listQuotes: async (bookIsbn) => quotes.filter((q) => q.bookIsbn === bookIsbn),
    addQuote: async (input) => {
      const q: Quote = {
        id: `q${quotes.length + 1}`,
        createdAt: new Date().toISOString(),
        ...input,
      };
      quotes.push(q);
      return q;
    },
    deleteQuote: async (id) => {
      const i = quotes.findIndex((q) => q.id === id);
      if (i >= 0) quotes.splice(i, 1);
    },
  };

  return { storage, books, entries, quotes };
}

describe("migrateLocalToCloud", () => {
  it("copies all library entries and quotes from local to cloud", async () => {
    const local = createLocalStorage({ namespace: `mig-${Math.random()}` });
    await local.addToLibrary({ isbn: "1", title: "A" });
    await local.addToLibrary({ isbn: "2", title: "B" });
    await local.addQuote({ bookIsbn: "1", text: "q1" });
    await local.addQuote({ bookIsbn: "1", text: "q2" });
    await local.addQuote({ bookIsbn: "2", text: "q3" });

    const cloud = makeMemoryCloud();
    const result = await migrateLocalToCloud(local, cloud.storage);

    expect(cloud.entries).toHaveLength(2);
    expect(cloud.quotes).toHaveLength(3);
    expect(result.booksMigrated).toBe(2);
    expect(result.quotesMigrated).toBe(3);
  });

  it("is idempotent — running twice does not duplicate entries", async () => {
    const local = createLocalStorage({ namespace: `mig2-${Math.random()}` });
    await local.addToLibrary({ isbn: "1", title: "A" });
    await local.addQuote({ bookIsbn: "1", text: "first" });

    const cloud = makeMemoryCloud();
    const first = await migrateLocalToCloud(local, cloud.storage);
    const second = await migrateLocalToCloud(local, cloud.storage);

    expect(cloud.entries).toHaveLength(1);
    expect(cloud.quotes).toHaveLength(1);
    expect(first.booksMigrated).toBe(1);
    expect(first.quotesMigrated).toBe(1);
    expect(second.booksMigrated).toBe(0);
    expect(second.quotesMigrated).toBe(0);
  });

  it("preserves book metadata in the cloud", async () => {
    const local = createLocalStorage({ namespace: `mig3-${Math.random()}` });
    await local.addToLibrary({
      isbn: "9788960773431",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      coverUrl: "https://x/y.jpg",
    });

    const cloud = makeMemoryCloud();
    await migrateLocalToCloud(local, cloud.storage);

    expect(cloud.books).toHaveLength(1);
    expect(cloud.books[0]).toMatchObject({
      isbn: "9788960773431",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      coverUrl: "https://x/y.jpg",
    });
  });

  it("skips a book that's already in the cloud (idempotency by isbn)", async () => {
    const local = createLocalStorage({ namespace: `mig4-${Math.random()}` });
    await local.addToLibrary({ isbn: "shared", title: "Shared" });
    await local.addToLibrary({ isbn: "only-local", title: "Local Only" });

    const cloud = makeMemoryCloud();
    // Pre-seed cloud with one of the books
    await cloud.storage.addToLibrary({ isbn: "shared", title: "Shared (cloud)" });

    const result = await migrateLocalToCloud(local, cloud.storage);

    expect(cloud.entries).toHaveLength(2);
    expect(result.booksMigrated).toBe(1); // only "only-local" got copied
  });
});
