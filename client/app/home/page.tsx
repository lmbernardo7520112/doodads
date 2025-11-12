// =============================================================
// 🏠 app/home/page.tsx
// -------------------------------------------------------------
// Página principal do cliente: banner + agendamentos + barbearias
// =============================================================

"use client";

import { useState } from "react";
import Image from "next/image";
import SearchBar from "@/components/ui/SearchBar";
import TagButton from "@/components/ui/TagButton";
import BarberCard from "@/components/ui/BarberCard";
import AppointmentCard from "@/components/ui/AppointmentCard";
import { useBarbearias } from "@/hooks/useBarbearias";
import { useReservas } from "@/hooks/useReservas";
import useRoleRedirect from "@/hooks/useRoleRedirect";

const TAGS = ["✂️ Cabelo", "💈 Barba", "✨ Combo"];

export default function HomePage() {
  useRoleRedirect(); // exige login

  const [query, setQuery] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(0);

  const { data: barbearias = [], loading: loadingBarb } = useBarbearias(selectedQuery || query);
  const { data: reservas = [], loading: loadingRes } = useReservas();

  const loading = loadingBarb || loadingRes;

  // 🔍 Extrair nomes para sugestões
  const suggestions = barbearias.map((b) => b.nome);

  const handleSelectSuggestion = (val: string) => {
    setSelectedQuery(val);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSelectedQuery(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 dark:text-gray-300">Carregando dados...</p>
      </div>
    );
  }

  // 🔹 Se há termo selecionado, filtra resultados exibidos
  const filtered = selectedQuery
    ? barbearias.filter((b) =>
        b.nome.toLowerCase().includes(selectedQuery.toLowerCase())
      )
    : barbearias;

  return (
    <div className="space-y-6 pb-6">
      {/* ========================================================== */}
      {/* 🖼️ Hero Banner */}
      {/* ========================================================== */}
      <div className="relative h-52 w-full rounded-2xl overflow-hidden shadow-md">
        <Image
          src="https://thumbs.dreamstime.com/z/barber-shop-chair-stylish-vintage-barber-chair-barbershop-armchair-modern-hairdresser-hair-salon-barber-shop-barber-shop-127929653.jpg"
          alt="Banner Doodads - Barber Shop"
          fill
          priority
          className="object-cover brightness-75"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-5">
          <h1 className="text-white text-2xl font-bold leading-tight drop-shadow-lg">
            Agende nos melhores <br />
            <span className="text-emerald-400">com a Doodads.</span>
          </h1>
          <p className="text-gray-200 text-sm mt-2">
            Escolha o melhor horário, com o melhor estilo. 💈
          </p>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🔍 Barra de pesquisa e tags */}
      {/* ========================================================== */}
      <SearchBar
        value={query}
        onChange={setQuery}
        loading={loadingBarb}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
        onClear={handleClearSearch}
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TAGS.map((t, i) => (
          <TagButton
            key={t}
            label={t}
            selected={sel === i}
            onClick={() => setSel(i)}
          />
        ))}
      </div>

      {/* ========================================================== */}
      {/* 📅 Agendamentos */}
      {/* ========================================================== */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          AGENDAMENTOS
        </h2>
        <div className="grid gap-3">
          {reservas.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Nenhum agendamento encontrado.
            </p>
          ) : (
            reservas.slice(0, 3).map((r: any) => (
              <AppointmentCard key={r._id} reserva={r} />
            ))
          )}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 💈 Barbearias recomendadas */}
      {/* ========================================================== */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recomendados</h2>
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Nenhuma barbearia encontrada.
            </p>
          ) : (
            filtered.map((b: any) => (
              <BarberCard key={b._id} barbearia={b} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
