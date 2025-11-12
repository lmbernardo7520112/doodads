"use client";

import { useReservas } from "@/hooks/useReservas";
import AppointmentCard from "@/components/ui/AppointmentCard";

export default function ReservasPage() {
  const { data: reservas, loading } = useReservas();

  if (loading) return <p className="text-center mt-10">Carregando agendamentos...</p>;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Meus Agendamentos</h1>
      {reservas.length === 0 ? (
        <p className="text-gray-500">Nenhuma reserva encontrada.</p>
      ) : (
        <div className="grid gap-4">
          {reservas.map((r) => (
            <AppointmentCard key={r._id} reserva={r} />
          ))}
        </div>
      )}
    </div>
  );
}
