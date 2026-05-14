import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import type { Book, Quote, LibraryEntry } from "./types";
import type { LibraryStorage } from "./storage";

/**
 * Supabase-backed `LibraryStorage` implementation used while the user
 * is signed in. Maps between camelCase domain types and the snake_case
 * Postgres columns (see `supabase/migrations/0001_init.sql` — Task 22).
 *
 * RLS scopes every row to `auth.uid()` so the implementation never has
 * to remember to filter by user except for cross-user disambiguation
 * (e.g. `listLibrary` is filtered defensively in case RLS is disabled
 * during local dev).
 */
export function createSupabaseStorage(client: SupabaseClient): LibraryStorage {
  async function userId(): Promise<string> {
    const { data } = await client.auth.getUser();
    const id = data.user?.id;
    if (!id) throw new Error("Not authenticated");
    return id;
  }

  function bookFromRow(row: any): Book {
    return {
      isbn: row.isbn,
      title: row.title,
      author: row.author ?? undefined,
      publisher: row.publisher ?? undefined,
      coverUrl: row.cover_url ?? undefined,
      description: row.description ?? undefined,
    };
  }

  function bookToRow(book: Book) {
    return {
      isbn: book.isbn,
      title: book.title,
      author: book.author ?? null,
      publisher: book.publisher ?? null,
      cover_url: book.coverUrl ?? null,
      description: book.description ?? null,
    };
  }

  function quoteFromRow(row: any): Quote {
    return {
      id: row.id,
      bookIsbn: row.book_isbn,
      text: row.text,
      page: row.page ?? undefined,
      createdAt: row.created_at,
    };
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

      // Always upsert canonical book metadata (cover URL may have changed)
      await client.from("books").upsert(bookToRow(book));

      // Compute next position
      const { data: existing } = await client
        .from("library_entries")
        .select("*")
        .eq("user_id", uid)
        .order("position", { ascending: true });
      const position = (existing ?? []).length;

      const row = {
        user_id: uid,
        book_isbn: book.isbn,
        added_at: new Date().toISOString(),
        position,
      };
      await client.from("library_entries").insert(row);

      return {
        bookIsbn: book.isbn,
        addedAt: row.added_at,
        position,
      };
    },

    async removeFromLibrary(isbn) {
      const uid = await userId();
      await client
        .from("library_entries")
        .delete()
        .eq("user_id", uid)
        .eq("book_isbn", isbn);
    },

    async getBook(isbn) {
      const { data } = await client
        .from("books")
        .select("*")
        .eq("isbn", isbn)
        .single();
      return data ? bookFromRow(data) : null;
    },

    async upsertBook(book) {
      await client.from("books").upsert(bookToRow(book));
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
        .map(quoteFromRow);
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
      const { data } = await client
        .from("quotes")
        .insert(row)
        .select()
        .single();
      return quoteFromRow(data);
    },

    async deleteQuote(id) {
      await client.from("quotes").delete().eq("id", id);
    },
  };
}
