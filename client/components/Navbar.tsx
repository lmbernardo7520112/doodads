"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
        <Link href="/home" className="font-display text-xl">Doodads</Link>
        <div className="flex items-center gap-3 text-sm">
          {user && <span className="text-gray-500 hidden sm:inline">Olá, {user.nomeCompleto.split(" ")[0]}</span>}
          {user ? (
            <button className="px-3 py-1.5 rounded-full bg-gray-900 text-white" onClick={logout}>Sair</button>
          ) : (
            <Link className="px-3 py-1.5 rounded-full bg-gray-900 text-white" href="/login">Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
