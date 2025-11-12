"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error("Preencha todos os campos!");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", { email, senha });

      // ✅ Passa os dados para o AuthContext
      login(response.data);

      // redirecionamento será feito automaticamente pelo AuthContext
    } catch (err: any) {
      console.error("❌ Erro no login:", err);
      toast.error(err.response?.data?.message || "Erro ao efetuar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Entrar na Doodads 💈
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          Ainda não tem conta?{" "}
          <a href="/register" className="text-emerald-500 font-semibold">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
