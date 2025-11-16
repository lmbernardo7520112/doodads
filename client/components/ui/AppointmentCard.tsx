// =============================================================
// 📅 components/ui/AppointmentCard.tsx
// -------------------------------------------------------------
// Exibe o resumo de uma reserva (agendamento do cliente)
// Agora com botão "Pagar Agora" integrado ao Stripe Checkout
// SEM REMOVER nenhuma funcionalidade existente
// =============================================================

"use client";

import Image from "next/image";
import { CheckCircle, Clock, XCircle, Timer, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AppointmentCardProps {
  reserva: {
    _id: string;
    dataHora: string;
    status: "pendente" | "confirmado" | "cancelado" | "finalizado";
    paymentStatus?: "pendente" | "aprovado" | "falhou";
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
  const { token } = useAuth();

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
  // 💳 Função que abre o checkout no Stripe
  // =============================================================
  const handlePagamento = async () => {
    if (!token) {
      toast.error("Você precisa estar autenticado.");
      return;
    }

    try {
      toast.loading("Redirecionando para pagamento...");

      const res = await api.post(
        "/pagamento/checkout",
        { reservaId: reserva._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss();
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Falha ao iniciar pagamento.");
      }
    } catch (err: any) {
      toast.dismiss();
      console.error("Erro ao iniciar checkout:", err);
      toast.error(err?.response?.data?.message || "Erro ao iniciar pagamento.");
    }
  };

  // =============================================================
  // 💅 Renderização
  // =============================================================
  return (
    <div className="flex flex-col gap-3 bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition">

      {/* Linha superior */}
      <div className="flex gap-3 items-center">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={imagemSrc}
            alt={`Imagem da barbearia ${reserva.barbearia?.nome ?? ""}`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <div className="flex flex-col justify-center flex-1">
          <h3 className="font-semibold text-gray-900">
            {reserva.barbearia?.nome ?? "Barbearia não identificada"}
          </h3>

          <p className="text-sm text-gray-600">
            {reserva.servico?.nome ?? "Serviço"} — 💰 R${" "}
            {reserva.servico?.preco?.toFixed(2) ?? "0,00"}
          </p>

          <p className="text-xs text-gray-500">{data}</p>

          <p className={`flex items-center gap-1 text-xs font-medium ${color}`}>
            {icon}
            {label}
          </p>
        </div>
      </div>

      {/* =============================================================
          💳 BOTÃO PAGAR AGORA
         Só aparece quando:
         - status é pendente
         - paymentStatus é pendente ou inexistente
         ============================================================= */}
      {reserva.status === "pendente" &&
        (reserva.paymentStatus === "pendente" ||
          !reserva.paymentStatus) && (
          <button
            onClick={handlePagamento}
            className="w-full bg-black text-white rounded-lg py-2 font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition"
          >
            <CreditCard className="w-4 h-4" />
            Pagar agora
          </button>
        )}
    </div>
  );
}
