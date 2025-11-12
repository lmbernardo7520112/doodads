// =============================================================
// 📅 components/ui/AppointmentCard.tsx
// -------------------------------------------------------------
// Exibe o resumo de uma reserva (agendamento do cliente)
// =============================================================

"use client";

import Image from "next/image";

interface AppointmentCardProps {
  reserva: {
    _id: string;
    dataHora: string;
    status: string;
    barbearia?: {
      nome: string;
      imagem?: string;
      telefone1?: string;
    };
    servico?: {
      nome: string;
      preco: number;
      duracaoMin: number;
    };
  };
}

export default function AppointmentCard({ reserva }: AppointmentCardProps) {
  const data = new Date(reserva.dataHora).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const imagemSrc =
    reserva.barbearia?.imagem ||
    "https://thumbs.dreamstime.com/z/barber-shop-chair-stylish-vintage-barber-chair-barbershop-armchair-modern-hairdresser-hair-salon-barber-shop-barber-shop-127929653.jpg?ct=jpeg";

  return (
    <div className="flex gap-3 items-center bg-white rounded-xl shadow-sm p-3">
      {/* Imagem da barbearia */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={imagemSrc}
          alt={`Imagem da barbearia ${reserva.barbearia?.nome ?? ""}`}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Informações */}
      <div className="flex flex-col justify-center">
        <h3 className="font-semibold text-gray-900">
          {reserva.barbearia?.nome ?? "Barbearia não identificada"}
        </h3>

        <p className="text-sm text-gray-600">
          {reserva.servico?.nome ?? "Serviço"} —{" "}
          R$ {reserva.servico?.preco?.toFixed(2) ?? "0,00"}
        </p>

        <p className="text-xs text-gray-500">{data}</p>

        <p
          className={`text-xs font-medium ${
            reserva.status === "confirmado"
              ? "text-green-600"
              : reserva.status === "pendente"
              ? "text-yellow-600"
              : "text-gray-400"
          }`}
        >
          {reserva.status.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
