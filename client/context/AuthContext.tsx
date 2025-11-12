"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api"; // ✅ Import corrigido — export default

// =============================================================
// 🧠 Tipos e Interfaces
// -------------------------------------------------------------
export type Role = "admin" | "barbeiro" | "cliente";

export interface User {
  id: string;
  nomeCompleto: string;
  email: string;
  tipo: Role;
  telefone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (payload: {
    nomeCompleto: string;
    email: string;
    senha: string;
    tipo: Role;
    telefone?: string;
  }) => Promise<void>;
  logout: () => void;
}

// =============================================================
// ⚙️ Contexto de Autenticação
// -------------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // 🧩 Hidratar sessão do localStorage ao carregar o app
  // ==========================================================
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setToken(stored);
        const { data } = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${stored}` },
        });
        setUser(data);
      } catch (err) {
        console.warn("Sessão expirada ou inválida. Limpando dados locais.");
        localStorage.removeItem("token");
        document.cookie = "token=; Max-Age=0; path=/";
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ==========================================================
  // 🔐 Função de Login
  // ==========================================================
  const login = async (email: string, senha: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, senha });
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; SameSite=Lax`;

      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      console.error("Erro no login:", err?.response?.data || err);
      throw err;
    }
  };

  // ==========================================================
  // 🧾 Registro de Novo Usuário
  // ==========================================================
  const register = async (payload: {
    nomeCompleto: string;
    email: string;
    senha: string;
    tipo: Role;
    telefone?: string;
  }) => {
    try {
      await api.post("/auth/register", payload);
    } catch (err: any) {
      console.error("Erro no registro:", err?.response?.data || err);
      throw err;
    }
  };

  // ==========================================================
  // 🚪 Logout
  // ==========================================================
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    document.cookie = "token=; Max-Age=0; path=/";
  };

  // ==========================================================
  // 🧩 Retorno do Provider
  // ==========================================================
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================
// 🧩 Hook de consumo (useAuth)
// -------------------------------------------------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
