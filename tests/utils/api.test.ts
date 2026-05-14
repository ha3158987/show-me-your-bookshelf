import { describe, it, expect, vi, beforeEach } from "vitest";

// Shared mock for the axios instance returned by axios.create().
// vi.mock is hoisted; the instance is captured at module-load time.
const mockGet = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({ get: mockGet }),
  },
}));

beforeEach(() => {
  mockGet.mockReset();
});

describe("fetchBookByIsbn", () => {
  it("returns mapped Book when API has a result", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        result: [
          {
            titleInfo: "이방인",
            authorInfo: "알베르 카뮈",
            pubInfo: "민음사",
            imageUrl: "https://x/y.jpg",
            isbn: "9788960773431",
          },
        ],
      },
    });

    const { fetchBookByIsbn } = await import("@/utils/api");
    const book = await fetchBookByIsbn("9788960773431");

    expect(book).toEqual({
      isbn: "9788960773431",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      coverUrl: "https://x/y.jpg",
      description: undefined,
      rawFromApi: expect.any(Object),
    });
  });

  it("returns null when API returns empty result", async () => {
    mockGet.mockResolvedValueOnce({ data: { result: [] } });

    const { fetchBookByIsbn } = await import("@/utils/api");
    expect(await fetchBookByIsbn("000")).toBeNull();
  });

  it("returns null when API returns no result field at all", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    const { fetchBookByIsbn } = await import("@/utils/api");
    expect(await fetchBookByIsbn("000")).toBeNull();
  });

  it("falls back gracefully when optional fields are missing", async () => {
    mockGet.mockResolvedValueOnce({
      data: { result: [{ titleInfo: "T", isbn: "111" }] },
    });

    const { fetchBookByIsbn } = await import("@/utils/api");
    const book = await fetchBookByIsbn("111");

    expect(book?.title).toBe("T");
    expect(book?.isbn).toBe("111");
    expect(book?.author).toBeUndefined();
    expect(book?.publisher).toBeUndefined();
    expect(book?.coverUrl).toBeUndefined();
  });

  it("propagates axios errors so callers can surface a toast", async () => {
    mockGet.mockRejectedValueOnce(new Error("network"));

    const { fetchBookByIsbn } = await import("@/utils/api");
    await expect(fetchBookByIsbn("111")).rejects.toThrow("network");
  });
});

describe("searchBooks", () => {
  it("maps every result row into a Book", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        result: [
          { titleInfo: "A", authorInfo: "Author A", isbn: "1" },
          { titleInfo: "B", authorInfo: "Author B", isbn: "2" },
        ],
      },
    });

    const { searchBooks } = await import("@/utils/api");
    const books = await searchBooks("test");

    expect(books).toHaveLength(2);
    expect(books[0]).toMatchObject({ title: "A", author: "Author A", isbn: "1" });
    expect(books[1]).toMatchObject({ title: "B", author: "Author B", isbn: "2" });
  });

  it("returns an empty array when there are no results", async () => {
    mockGet.mockResolvedValueOnce({ data: { result: [] } });

    const { searchBooks } = await import("@/utils/api");
    expect(await searchBooks("nope")).toEqual([]);
  });
});
