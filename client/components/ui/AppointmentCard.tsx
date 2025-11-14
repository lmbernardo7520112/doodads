// =============================================================
// 📅 components/ui/AppointmentCard.tsx
// -------------------------------------------------------------
// Exibe o resumo de uma reserva (agendamento do cliente)
// Compatível com PRD-004 — inclui status visual e sem regressões
// =============================================================

"use client";

import Image from "next/image";
import { CheckCircle, Clock, XCircle, Timer } from "lucide-react";

interface AppointmentCardProps {
  reserva: {
    _id: string;
    dataHora: string;
    status: "pendente" | "confirmado" | "cancelado" | "finalizado";
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
  // Use toLocaleString para mostrar data + hora corretamente
  const data = new Date(reserva.dataHora).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const imagemSrc =
    reserva.barbearia?.imagem ||
    "https://thumbs.dreamstime.com/z/barber-shop-chair-stylish-vintage-barber-chair-barbershop-armchair-modern-hairdresser-hair-salon-barber-shop-barber-shop-127929653.jpg?ct=jpeg";

  // =============================================================
  // 🎨 Função auxiliar para exibir status com cor e ícone
  // =============================================================
  const getStatusInfo = () => {
    switch (reserva.status) {
      case "confirmado":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: "Confirmado",
          color: "text-green-600",
        };
      case "pendente":
        return {
          icon: <Clock className="w-4 h-4" />,
          label: "Pendente",
          color: "text-yellow-600",
        };
      case "cancelado":
        return {
          icon: <XCircle className="w-4 h-4" />,
          label: "Cancelado",
          color: "text-red-600",
        };
      case "finalizado":
        return {
          icon: <Timer className="w-4 h-4" />,
          label: "Finalizado",
          color: "text-gray-500",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          label: "Desconhecido",
          color: "text-gray-400",
        };
    }
  };

  const { icon, label, color } = getStatusInfo();

  // =============================================================
  // 💅 Renderização
  // =============================================================
  return (
    <div className="flex gap-3 items-center bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition">
      {/* 🖼️ Imagem da barbearia */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={imagemSrc}
          alt={`Imagem da barbearia ${reserva.barbearia?.nome ?? ""}`}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* 📋 Informações da reserva */}
      <div className="flex flex-col justify-center flex-1">
        <h3 className="font-semibold text-gray-900">
          {reserva.barbearia?.nome ?? "Barbearia não identificada"}
        </h3>

        <p className="text-sm text-gray-600">
          {reserva.servico?.nome ?? "Serviço"} — 💰 R${" "}
          {reserva.servico?.preco?.toFixed(2) ?? "0,00"}
        </p>

        <p className="text-xs text-gray-500">{data}</p>

        {/* 🟡 Status visual */}
        <p className={`flex items-center gap-1 text-xs font-medium ${color}`}>
          {icon}
          {label}
        </p>
      </div>
    </div>
  );
}
