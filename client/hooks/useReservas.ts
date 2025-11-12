// client/hooks/useReservas.ts

// =============================================================
// 🎯 useReservas.ts — Hook de reservas (agendamentos)
// =============================================================


import useSWR from "swr";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useReservas() {
  const { token } = useAuth();

  const fetcher = async (url: string) => {
    const res = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const { data, error, isLoading } = useSWR(token ? "/reservas/minhas" : null, fetcher);

  return {
    data: data || [],
    loading: isLoading,
    error,
  };
}
