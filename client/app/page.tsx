"use client";
import { useState } from "react";
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
  const [sel, setSel] = useState<number | null>(0);
  const { data: barbearias } = useBarbearias(query);
  const { data: reservas } = useReservas();

  return (
    <div className="space-y-6">
      <SearchBar value={query} onChange={setQuery} />
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TAGS.map((t, i) => (
          <TagButton key={t} label={t} selected={sel === i} onClick={() => setSel(i)} />
        ))}
      </div>
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500">AGENDAMENTOS</h2>
        <div className="grid gap-3">
          {Array.isArray(reservas) && reservas.length > 0 ? (
            reservas.slice(0, 3).map((r: any) => (
              <AppointmentCard key={r._id} reserva={r} />
            ))
          ) : (
            <p className="text-gray-400 text-sm">Nenhum agendamento encontrado.</p>
          )}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Recomendados</h2>
        <div className="grid gap-4">
          {barbearias.map((b: any) => (
            <BarberCard key={b._id} barbearia={b} />  // Alterado: barbearia={b}
          ))}
        </div>
      </section>
    </div>
  );
}