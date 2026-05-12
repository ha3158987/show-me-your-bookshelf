import { createStore, get, set, del, keys, type UseStore } from "idb-keyval";
import { v4 as uuid } from "uuid";
import type { Book, Quote, LibraryEntry } from "./types";
import type { LibraryStorage } from "./storage";

interface Options {
  /**
   * Namespace prefix for the IndexedDB databases. Lets tests run in
   * isolated stores. Defaults to "bookshelf".
   */
  namespace?: string;
}

/**
 * IndexedDB-backed `LibraryStorage` implementation used while the user
 * is in guest mode. On sign-in, `migrateLocalToCloud()` copies all
 * entries and quotes into the Supabase store (see Task 10).
 */
export function createLocalStorage(opts: Options = {}): LibraryStorage {
  const ns = opts.namespace ?? "bookshelf";
  const booksStore: UseStore = createStore(`${ns}-books-db`, "books");
  const entriesStore: UseStore = createStore(`${ns}-entries-db`, "entries");
  const quotesStore: UseStore = createStore(`${ns}-quotes-db`, "quotes");

  return {
    async listLibrary() {
      const isbns = (await keys(entriesStore)) as string[];
      const list = await Promise.all(
        isbns.map((isbn) => get<LibraryEntry>(isbn, entriesStore)),
      );
      return list
        .filter((x): x is LibraryEntry => !!x)
        .sort((a, b) => a.position - b.position);
    },

    async addToLibrary(book) {
      // Always upsert the book metadata (cover URL / title may have changed)
      await set(book.isbn, book, booksStore);

      const existing = await get<LibraryEntry>(book.isbn, entriesStore);
      if (existing) return existing;

      const count = (await keys(entriesStore)).length;
      const entry: LibraryEntry = {
        bookIsbn: book.isbn,
        addedAt: new Date().toISOString(),
        position: count,
      };
      await set(book.isbn, entry, entriesStore);
      return entry;
    },

    async removeFromLibrary(isbn) {
      await del(isbn, entriesStore);
    },

    async getBook(isbn) {
      return (await get<Book>(isbn, booksStore)) ?? null;
    },

    async upsertBook(book) {
      await set(book.isbn, book, booksStore);
    },

    async listQuotes(bookIsbn) {
      const ids = await keys(quotesStore);
      const list = await Promise.all(
        ids.map((id) => get<Quote>(id as string, quotesStore)),
      );
      return list
        .filter((q): q is Quote => !!q && q.bookIsbn === bookIsbn)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async addQuote(input) {
      const q: Quote = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...input,
      };
      await set(q.id, q, quotesStore);
      return q;
    },

    async deleteQuote(id) {
      await del(id, quotesStore);
    },
  };
}
