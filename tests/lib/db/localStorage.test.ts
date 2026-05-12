import { describe, it, expect, beforeEach } from "vitest";
import { createLocalStorage } from "@/lib/db/localStorage";
import type { LibraryStorage } from "@/lib/db/storage";

describe("createLocalStorage (IndexedDB)", () => {
  let storage: LibraryStorage;

  beforeEach(() => {
    // Unique namespace per test → isolated stores
    storage = createLocalStorage({ namespace: `test-${Math.random()}` });
  });

  it("adds a book to library and lists it", async () => {
    await storage.addToLibrary({ isbn: "111", title: "A" });
    const entries = await storage.listLibrary();
    expect(entries).toHaveLength(1);
    expect(entries[0].bookIsbn).toBe("111");
  });

  it("persists book metadata for later retrieval", async () => {
    await storage.addToLibrary({
      isbn: "222",
      title: "B",
      author: "X",
      publisher: "Y",
      coverUrl: "https://x/y.jpg",
    });
    const book = await storage.getBook("222");
    expect(book?.title).toBe("B");
    expect(book?.author).toBe("X");
    expect(book?.publisher).toBe("Y");
    expect(book?.coverUrl).toBe("https://x/y.jpg");
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
    await storage.addToLibrary({ isbn: "a3", title: "3" });
    const entries = await storage.listLibrary();
    expect(entries.map((e) => e.position)).toEqual([0, 1, 2]);
  });

  it("is idempotent on duplicate addToLibrary (same isbn keeps original position)", async () => {
    const first = await storage.addToLibrary({ isbn: "dup", title: "T" });
    await storage.addToLibrary({ isbn: "other", title: "Other" });
    const second = await storage.addToLibrary({ isbn: "dup", title: "T" });

    expect(second.position).toBe(first.position);
    expect(await storage.listLibrary()).toHaveLength(2);
  });

  it("returns null when getting a book that was never added", async () => {
    expect(await storage.getBook("never-added")).toBeNull();
  });

  it("filters quotes by bookIsbn (cross-book isolation)", async () => {
    await storage.addToLibrary({ isbn: "bk1", title: "1" });
    await storage.addToLibrary({ isbn: "bk2", title: "2" });
    await storage.addQuote({ bookIsbn: "bk1", text: "for bk1" });
    await storage.addQuote({ bookIsbn: "bk2", text: "for bk2" });
    await storage.addQuote({ bookIsbn: "bk1", text: "also bk1" });

    const bk1Quotes = await storage.listQuotes("bk1");
    const bk2Quotes = await storage.listQuotes("bk2");
    expect(bk1Quotes).toHaveLength(2);
    expect(bk2Quotes).toHaveLength(1);
    expect(bk2Quotes[0].text).toBe("for bk2");
  });
});
