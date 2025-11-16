import api from "./api";
import { useAuth } from "@/context/AuthContext";

export function useAuthedFetcher() {
  const { token } = useAuth();

  return async (url: string) => {
    if (!token) {
      console.warn("⚠️ SWR tentou buscar sem token:", url);
      throw new Error("Token não disponível");
    }

    const res = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.data;
  };
}
