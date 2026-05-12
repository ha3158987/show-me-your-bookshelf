import axios from "axios";
import type { Book } from "@/lib/db/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  params: {
    key: process.env.NEXT_PUBLIC_API_KEY,
  },
});

/**
 * Raw API search.
 *
 * @param searchTarget total (전체), title (제목), author (저자), publisher (발행자),
 *                     cheonggu (청구기호), 생략 시 전체
 * @param keyword 검색어
 * @returns API의 원본 응답 (`{ result: [...] }` 모양)
 */
export const fetchBooks = async (searchTarget: string, keyword: string) => {
  try {
    const { data } = await api.get("?systemType=오프라인자료", {
      params: {
        srchTarget: searchTarget,
        kwd: keyword,
        apiType: "json",
        category: "도서",
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};

/**
 * Maps a raw row from the Korean library API into our `Book` domain type.
 * Field-name fallbacks are intentional: the upstream API has multiple
 * historical aliases (`titleInfo` vs `title`, `imageUrl` vs `coverUrl`)
 * and we want resilience until Task 11's live-response audit confirms
 * the canonical names. Raw response is retained for debugging.
 */
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

/**
 * Looks up a single book by ISBN. Returns `null` when the API has no
 * match. Errors (network / 5xx) are re-thrown so callers can show a
 * toast.
 */
export async function fetchBookByIsbn(isbn: string): Promise<Book | null> {
  try {
    const { data } = await api.get("?systemType=오프라인자료", {
      params: {
        srchTarget: "isbn",
        kwd: isbn,
        apiType: "json",
        category: "도서",
      },
    });
    const raw = data?.result?.[0];
    return raw ? mapApiBook(raw) : null;
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    throw error;
  }
}

/**
 * Title-based search returning typed `Book[]`. Convenience over
 * `fetchBooks("title", keyword)` for UI components that want the
 * mapped shape directly.
 */
export async function searchBooks(keyword: string): Promise<Book[]> {
  const data = await fetchBooks("title", keyword);
  const raws: any[] = data?.result ?? [];
  return raws.map(mapApiBook);
}
