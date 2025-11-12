"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export function useServicos(barbeariaId?: string) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!barbeariaId) return;
    api.get(`/servicos/${barbeariaId}`).then((res) => setData(res.data));
  }, [barbeariaId]);
  return data;
}
