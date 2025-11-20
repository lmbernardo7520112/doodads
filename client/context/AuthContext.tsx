// =============================================================
// 🚀 AuthContext.tsx — Versão FINAL Estável
// -------------------------------------------------------------
// Melhorias aplicadas:
//  - Mantém 100% das funcionalidades existentes
//  - Corrige race conditions de loading/token
//  - Evita double-render e loops
//  - Garante que login, logout e reload funcionem sem SWR quebrar
//  - Protege contra tokens inválidos / arrays / nulos
// =============================================================

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export type Role = "admin" | "barbeiro" | "cliente";

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (data: any) => void;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 🔥 loading verdadeiro ATÉ termos uma decisão sobre a sessão
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // =============================================================
  // 🔍 DEBUG SEGURO (não quebra hooks)
  // =============================================================
  useEffect(() => {
    console.log("📦 Auth state atualizado ->", { user, token, loading });
  }, [user, token, loading]);

  // =============================================================
  // 🔄 Carrega sessão persistida
  // =============================================================
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");

      if (stored) {
        const parsed = JSON.parse(stored);

        const safeToken =
          typeof parsed.token === "string"
            ? parsed.token
            : Array.isArray(parsed.token)
            ? parsed.token[0]
            : null;

        setUser(parsed.user ?? null);
        setToken(safeToken ?? null);

        // Regrava para garantir estrutura correta
        localStorage.setItem(
          "auth",
          JSON.stringify({ user: parsed.user, token: safeToken })
        );
      }
    } catch (err) {
      console.error("❌ Erro ao recuperar sessão:", err);
    } finally {
      // 🚀 loading FINALIZA somente aqui
      setLoading(false);
    }
  }, []);

  // =============================================================
  // 🔐 LOGIN — sem alterar ordem de hooks
  // =============================================================
  const login = (data: any) => {
    const clean = {
      user: data.user,
      token: data.token,
    };

    setUser(clean.user);
    setToken(clean.token);
    localStorage.setItem("auth", JSON.stringify(clean));

    toast.success("Login realizado com sucesso!");

    // 🔥 evitar re-render imediato no mesmo tick
    setTimeout(() => {
      router.push("/home");
    }, 50);
  };

  // =============================================================
  // 🆕 REGISTER
  // =============================================================
  const register = async (data: any) => {
    try {
      await api.post("/auth/register", data);
      toast.success("Conta criada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao registrar.");
      throw err;
    }
  };

  // =============================================================
  // 🚪 LOGOUT SEGURO
  // =============================================================
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");

    // Evita conflito com SWR: redirect assíncrono
    setTimeout(() => router.push("/login"), 10);
  };

  // =============================================================
  // ⏳ Expiração do token (evento vindo do Axios)
  // =============================================================
  useEffect(() => {
    const handleExpired = () => {
      toast.error("Sessão expirada. Faça login novamente.");
      logout();
    };

    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  // =============================================================
  // PROVIDER FINAL
  // =============================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
