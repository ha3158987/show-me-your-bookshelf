import { describe, it, expectTypeOf } from "vitest";
import type { Book, Quote, LibraryEntry } from "@/lib/db/types";

describe("domain types", () => {
  it("Book requires isbn and title only", () => {
    const b: Book = { isbn: "9788960773431", title: "이방인" };
    expectTypeOf(b).toMatchTypeOf<Book>();
  });

  it("Book accepts optional metadata", () => {
    const b: Book = {
      isbn: "9788960773431",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      coverUrl: "https://x/y.jpg",
      description: "...",
      rawFromApi: { foo: "bar" },
    };
    expectTypeOf(b).toMatchTypeOf<Book>();
  });

  it("Quote requires id, bookIsbn, text, createdAt", () => {
    const q: Quote = {
      id: "u",
      bookIsbn: "9788960773431",
      text: "...",
      createdAt: "2026-05-12T00:00:00Z",
    };
    expectTypeOf(q).toMatchTypeOf<Quote>();
  });

  it("LibraryEntry requires bookIsbn, addedAt, position", () => {
    const e: LibraryEntry = {
      bookIsbn: "9788960773431",
      addedAt: "2026-05-12T00:00:00Z",
      position: 0,
    };
    expectTypeOf(e).toMatchTypeOf<LibraryEntry>();
  });
});
