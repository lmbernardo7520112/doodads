"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login(email, senha);
      router.push("/home");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-4">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded-md px-3 py-2" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded-md px-3 py-2" type="password" placeholder="Senha"
          value={senha} onChange={e=>setSenha(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading}
          className="w-full bg-gray-900 text-white py-2 rounded-md">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-3">
        Ainda não tem conta? <a className="underline" href="/register">Registre-se</a>
      </p>
    </div>
  );
}
