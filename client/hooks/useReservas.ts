// =============================================================
// 🎯 useReservas.ts — Versão FINAL com bloqueio de SWR + LOGS
// =============================================================

"use client";

import { useEffect } from "react";
import useSWR from "swr";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useReservas(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};
  const { token, loading: authLoading } = useAuth();

  // LOG: estado do auth
  console.debug(
    `[useReservas] authLoading=${authLoading} tokenPresent=${!!token} enabled=${enabled}`
  );

  const fetcher = async (url: string) => {
    console.debug(
      `[useReservas:fetcher] GET ${url} sendingAuth=${!!token}`
    );
    const urlWithCacheBust = url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const res = await api.get(urlWithCacheBust, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.debug(
      `[useReservas:fetcher] GET ${url} received=${Array.isArray(res.data) ? res.data.length : "?"} items`
    );
    return Array.isArray(res.data) ? res.data : [];
  };

  // Só busca quando:
  // - AuthContext terminou (loading = false)
  // - Token existe
  // - Enabled é true
  const shouldFetch = enabled && !authLoading && !!token;

  console.debug(`[useReservas] shouldFetch=${shouldFetch}`);

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    shouldFetch ? "/reservas/minhas" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 0, // Força checagem sempre (debug)
    }
  );

  // Polling (30s)
  useEffect(() => {
    if (!shouldFetch) return;
    console.debug("[useReservas] polling ativo");
    const interval = setInterval(() => {
      console.debug("[useReservas] polling → mutate()");
      mutate();
    }, 30000);
    return () => clearInterval(interval);
  }, [shouldFetch, mutate]);

  return {
    data: data || [],
    loading: isLoading || authLoading,
    error,
    mutate,
    isValidating,
  };
}
