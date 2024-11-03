import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  params: {
    key: process.env.NEXT_PUBLIC_API_KEY,
  },
});

/**
 *
 * @param searchTarget total (전체), title (제목), author (저자), publisher (발행자), cheonggu (청구기호), 생략시 전체
 * @param keyword 검색어
 * @returns
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
