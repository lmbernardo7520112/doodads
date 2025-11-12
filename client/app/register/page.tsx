"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Role } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ nomeCompleto: "", email: "", senha: "", tipo: "cliente" as Role });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form);
    router.push("/login");
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-4">Criar conta</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded-md px-3 py-2" placeholder="Nome completo"
          value={form.nomeCompleto} onChange={e=>setForm({...form, nomeCompleto: e.target.value})} />
        <input className="w-full border rounded-md px-3 py-2" placeholder="Email"
          value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
        <input className="w-full border rounded-md px-3 py-2" type="password" placeholder="Senha"
          value={form.senha} onChange={e=>setForm({...form, senha: e.target.value})} />
        <select className="w-full border rounded-md px-3 py-2"
          value={form.tipo} onChange={e=>setForm({...form, tipo: e.target.value as Role})}>
          <option value="cliente">Cliente</option>
          <option value="barbeiro">Barbeiro</option>
          <option value="admin">Administrador</option>
        </select>
        <button className="w-full bg-gray-900 text-white py-2 rounded-md">Registrar</button>
      </form>
    </div>
  );
}
