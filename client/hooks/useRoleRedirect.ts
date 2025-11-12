"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function useRoleRedirect() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // ainda inicializando contexto

    // 🚫 Ignora o hook completamente nas rotas públicas
    const isPublic = pathname === "/login" || pathname === "/register";
    if (isPublic) return;

    // 🔒 Se não autenticado → redireciona
    if (!token) {
      router.push("/login");
    }
  }, [user, token, loading, pathname, router]);
}

