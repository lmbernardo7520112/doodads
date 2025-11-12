"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (data: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("📦 Auth state ->", { user, token });
  }, [user, token]);

  // 🔄 Recupera sessão persistida
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      }
    } catch (err) {
      console.error("Erro ao recuperar sessão:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Login: define sessão e redireciona para /home
  const login = (data: any) => {
  setUser(data.user);
  setToken(data.token);
  localStorage.setItem("auth", JSON.stringify(data));

  toast.success("Login realizado com sucesso!");

  // ⏳ Aguarda atualização de estado antes de navegar
  setTimeout(() => {
    router.push("/home");
    }, 200);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
    router.push("/login");
  };

  // 🕒 Sessão expirada
  useEffect(() => {
    const handleExpired = () => {
      toast.error("Sessão expirada. Faça login novamente.");
      logout();
    };
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
