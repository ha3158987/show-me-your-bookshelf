import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  params: {
    key: process.env.NEXT_PUBLIC_API_KEY,
  },
});

export const fetchBooks = async (keyword: string) => {
  try {
    const { data } = await api.get("?systemType=오프라인자료", {
      params: {
        kwd: keyword,
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};
