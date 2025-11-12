"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export function useBarbearias(query?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = "/barbearias";
    if (query && query.trim()) url += `?q=${encodeURIComponent(query.trim())}`;
    setLoading(true);
    api.get(url)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [query]);
  

  return { data, loading };
}

