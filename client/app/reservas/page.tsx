// =============================================================
// 📋 app/reservas/page.tsx
// -------------------------------------------------------------
// Listagem de reservas do cliente com filtros por status.
// Phase E3.1: Filtros Ativas/Canceladas/Todas
// =============================================================

"use client";

import { useState, useMemo } from "react";
import { useReservas } from "@/hooks/useReservas";
import AppointmentCard from "@/components/ui/AppointmentCard";
import { Loader2 } from "lucide-react";

type FilterTab = "ativas" | "canceladas" | "todas";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "ativas", label: "Ativas" },
  { id: "canceladas", label: "Canceladas" },
  { id: "todas", label: "Todas" },
];

export default function ReservasPage() {
  const { data: reservas, loading, mutate } = useReservas();
  const [activeTab, setActiveTab] = useState<FilterTab>("ativas");

  const filtered = useMemo(() => {
    if (activeTab === "ativas") {
      return reservas.filter(
        (r: any) => r.status !== "cancelado" && r.status !== "finalizado"
      );
    }
    if (activeTab === "canceladas") {
      return reservas.filter((r: any) => r.status === "cancelado");
    }
    return reservas; // "todas"
  }, [reservas, activeTab]);

  // Count badges
  const counts = useMemo(() => {
    const ativas = reservas.filter(
      (r: any) => r.status !== "cancelado" && r.status !== "finalizado"
    ).length;
    const canceladas = reservas.filter(
      (r: any) => r.status === "cancelado"
    ).length;
    return { ativas, canceladas, todas: reservas.length };
  }, [reservas]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
        <p className="text-gray-500 text-sm">Carregando agendamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-xl font-bold text-gray-900">Meus Agendamentos</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === "ativas"
              ? counts.ativas
              : tab.id === "canceladas"
              ? counts.canceladas
              : counts.todas;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reservas List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">
            {activeTab === "ativas"
              ? "Nenhuma reserva ativa."
              : activeTab === "canceladas"
              ? "Nenhuma reserva cancelada."
              : "Nenhuma reserva encontrada."}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {activeTab === "ativas"
              ? "Seus novos agendamentos aparecerão aqui."
              : ""}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r: any) => (
            <AppointmentCard
              key={r._id}
              reserva={r}
              onUpdate={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
