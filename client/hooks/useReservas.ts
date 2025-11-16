// =============================================================
// 🎯 useReservas.ts — Hook de reservas (agendamentos) com polling
// =============================================================

// =============================================================
// 🎯 useReservas.ts — Hook de reservas (agendamentos) com polling
// =============================================================

"use client";

import { useEffect } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useReservas() {
  const { token } = useAuth();

  const fetcher = async (url: string) => {
    const res = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 🔥 GARANTE QUE SEMPRE RETORNA ARRAY
    return Array.isArray(res.data) ? res.data : [];
  };

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    token ? "/reservas/minhas" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // 🔁 Polling leve (a cada 30 s)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => mutate(), 30_000);
    return () => clearInterval(interval);
  }, [token, mutate]);

  return {
    data: data || [],
    loading: isLoading,
    error,

    // 🔥🔥🔥 ADICIONADO — sem quebrar nada
    mutate,
    isValidating,
  };
}
