// =============================================================
// 🎯 useBarbearias.ts — Hook de barbearias
// =============================================================

"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

/**
 * Hook avançado de busca de barbearias com debounce adaptativo inteligente.
 * Mede o ritmo de digitação e ajusta o tempo de espera entre 150 – 700 ms.
 */
export function useBarbearias(query?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Medição de velocidade de digitação
  const lastKeyTimeRef = useRef<number | null>(null);
  const avgIntervalRef = useRef<number>(400); // valor inicial médio
  const [debounceDelay, setDebounceDelay] = useState<number>(400);

  useEffect(() => {
    // Detecta digitação para medir tempo médio entre teclas
    const handleKeyPress = () => {
      const now = Date.now();
      if (lastKeyTimeRef.current) {
        const diff = now - lastKeyTimeRef.current;
        // suavização (média exponencial)
        avgIntervalRef.current = avgIntervalRef.current * 0.7 + diff * 0.3;

        // Ajusta dinamicamente o debounceDelay
        const adaptiveDelay = Math.min(
          700,
          Math.max(150, avgIntervalRef.current * 1.5)
        );
        setDebounceDelay(adaptiveDelay);
      }
      lastKeyTimeRef.current = now;
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    if (query === undefined) return;

    const controller = new AbortController();

    const delayDebounce = setTimeout(() => {
      const fetchData = async () => {
        try {
          setLoading(true);

          let url = "/barbearias";
          if (query && query.trim()) {
            url += `?q=${encodeURIComponent(query.trim())}`;
          }

          const res = await api.get(url, { signal: controller.signal });
          setData(res.data);
        } catch (error: any) {
          if (error.name !== "CanceledError" && error.message !== "canceled") {
            console.error("❌ Erro ao buscar barbearias:", error);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, debounceDelay);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [query, debounceDelay]);

  return { data, loading, debounceDelay };
}
