/**
 * Domain types for the personal bookshelf.
 *
 * Persistence-agnostic — these types are shared between the IndexedDB
 * implementation (guest mode) and the Supabase implementation (signed-in)
 * via the `LibraryStorage` interface. See `docs/superpowers/specs/2026-05-12-bookshelf-design.md`
 * §2.1 for the canonical schema.
 */

/** A book record. `isbn` is the primary identifier across both stores. */
export interface Book {
  /** ISBN-10 or ISBN-13, normalized to digits-only string. */
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  /** Public URL to the cover image returned by the book API. */
  coverUrl?: string;
  description?: string;
  /** Untyped raw API response retained for debugging / future migration. */
  rawFromApi?: unknown;
}

/** A passage the user wants to remember from a book. */
export interface Quote {
  /** uuid v4. */
  id: string;
  /** Foreign key to {@link Book.isbn}. */
  bookIsbn: string;
  text: string;
  page?: number;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/**
 * A book's placement in the user's shelf.
 *
 * `position` lets us preserve ordering across local ↔ cloud migration
 * and unblocks future drag-and-drop reordering without a schema change.
 */
export interface LibraryEntry {
  /** Foreign key to {@link Book.isbn}. */
  bookIsbn: string;
  /** ISO 8601 timestamp. */
  addedAt: string;
  /** Zero-based ordinal within the user's library. */
  position: number;
}
