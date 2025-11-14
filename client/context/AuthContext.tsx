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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔍 DEBUG AUTOMÁTICO
  useEffect(() => {
    console.log("📦 Auth state atualizado ->", { user, token });
  }, [user, token]);


  // 🔄 Carrega sessão persistida (SEMPRE com token string)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);

        // Corrige casos antigos onde salvava array!
        const safeToken =
          typeof parsed.token === "string"
            ? parsed.token
            : Array.isArray(parsed.token)
            ? parsed.token[0] // pega somente o primeiro válido
            : null;

        setUser(parsed.user ?? null);
        setToken(safeToken ?? null);

        // 🔥 Regrava garantindo estrutura correta
        localStorage.setItem(
          "auth",
          JSON.stringify({ user: parsed.user, token: safeToken })
        );
      }
    } catch (err) {
      console.error("❌ Erro ao recuperar sessão:", err);
    } finally {
      setLoading(false);
    }
  }, []);


  // 🔐 LOGIN — garante persistência correta
  const login = (data: any) => {
    const clean = {
      user: data.user,
      token: data.token,
    };

    setUser(clean.user);
    setToken(clean.token);
    localStorage.setItem("auth", JSON.stringify(clean));

    toast.success("Login realizado com sucesso!");

    setTimeout(() => router.push("/home"), 200);
  };


  // 🆕 REGISTER
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


  // 🚪 LOGOUT SEGURO
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    router.push("/login");
  };


  // Expiração automática de sessão
  useEffect(() => {
    const handleExpired = () => {
      toast.error("Sessão expirada. Faça login novamente.");
      logout();
    };
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
