// =============================================================
// 📅 components/ui/AppointmentCard.tsx
// -------------------------------------------------------------
// Card de agendamento com suporte a status de pagamento manual,
// instrução persistente de pagamento, e modal de cancelamento.
// Phase E3: Corrigido fluxo do cliente + window.confirm removido.
// =============================================================

"use client";

import Image from "next/image";
import {
  CheckCircle,
  Clock,
  XCircle,
  Timer,
  AlertTriangle,
  Ban,
  Eye,
  Loader2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

interface AppointmentCardProps {
  reserva: {
    _id: string;
    dataHora: string;
    status: "pendente" | "confirmado" | "cancelado" | "finalizado";
    paymentStatus?:
      | "pendente"
      | "aprovado"
      | "falhou"
      | "not_required"
      | "pending"
      | "paid"
      | "expired"
      | "refunded"
      | "failed"
      | "manual_review"
      | "cancelled";
    paymentRequired?: boolean;
    paymentExpiresAt?: string;
    cancelReason?: string;
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
  onUpdate?: () => void;
}

// =============================================================
// 🎨 Mapeamento de status de pagamento para labels PT-BR
// =============================================================
const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; description: string; tone: string; icon: React.ReactNode }
> = {
  pendente: {
    label: "Pagamento pendente",
    description: "Aguardando processamento.",
    tone: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  pending: {
    label: "Aguardando pagamento manual",
    description: "Realize o pagamento diretamente à barbearia.",
    tone: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  aprovado: {
    label: "Pagamento aprovado",
    description: "Confirmado.",
    tone: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  paid: {
    label: "Pagamento confirmado",
    description: "Pagamento recebido pela barbearia.",
    tone: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  expired: {
    label: "Pagamento expirado",
    description: "O prazo expirou.",
    tone: "text-red-600 bg-red-50 border-red-200",
    icon: <Timer className="w-3.5 h-3.5" />,
  },
  falhou: {
    label: "Pagamento falhou",
    description: "Erro no processamento.",
    tone: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  failed: {
    label: "Pagamento falhou",
    description: "Ocorreu uma falha.",
    tone: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  refunded: {
    label: "Reembolsado",
    description: "O valor foi devolvido.",
    tone: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  manual_review: {
    label: "Em análise manual",
    description: "Encaminhado para análise.",
    tone: "text-amber-700 bg-amber-50 border-amber-300",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  not_required: {
    label: "Pagamento não exigido",
    description: "Sem pré-pagamento necessário.",
    tone: "text-gray-500 bg-gray-50 border-gray-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Pagamento cancelado",
    description: "Pagamento cancelado junto com a reserva.",
    tone: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export default function AppointmentCard({
  reserva,
  onUpdate,
}: AppointmentCardProps) {
  const { token } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
  // 🎨 Status da reserva
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
          label: "Cancelada",
          color: "text-red-600",
        };
      case "finalizado":
        return {
          icon: <Timer className="w-4 h-4" />,
          label: "Finalizada",
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
  // 💳 Status de pagamento
  // =============================================================
  const paymentInfo =
    reserva.paymentStatus && PAYMENT_STATUS_MAP[reserva.paymentStatus]
      ? PAYMENT_STATUS_MAP[reserva.paymentStatus]
      : null;

  // Expiração do pagamento
  const paymentExpiresAt = reserva.paymentExpiresAt
    ? new Date(reserva.paymentExpiresAt)
    : null;
  const isPaymentExpiring =
    paymentExpiresAt &&
    reserva.paymentStatus === "pending" &&
    paymentExpiresAt.getTime() > Date.now();
  const expiresInMinutes = isPaymentExpiring
    ? Math.max(0, Math.round((paymentExpiresAt!.getTime() - Date.now()) / 60000))
    : null;

  // P0-C: Verifica se o pagamento manual está pendente e a reserva está ativa
  const isManualPaymentPending =
    reserva.paymentRequired &&
    reserva.paymentStatus === "pending" &&
    reserva.status !== "cancelado";

  // =============================================================
  // ❌ Cancelar reserva (via modal)
  // =============================================================
  const handleCancelConfirm = async (reason?: string) => {
    if (!token) {
      toast.error("Você precisa estar autenticado.");
      return;
    }

    try {
      setCancelling(true);
      setShowCancelModal(false);
      await api.patch(
        `/reservas/${reserva._id}/cancelar`,
        { reason: reason || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Reserva cancelada com sucesso!");
      onUpdate?.();
    } catch (err: any) {
      console.error("❌ Erro ao cancelar:", err);
      const msg =
        err?.response?.data?.message || "Erro ao cancelar reserva.";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  // =============================================================
  // 🎨 Render UI
  // =============================================================
  // E3.2: Reserva com horário já passado
  const isPast = new Date(reserva.dataHora).getTime() < Date.now();

  // P0-B + E3.2: Block cancel for paid/aprovado/past reservas
  const canCancel =
    reserva.status === "pendente" &&
    reserva.paymentStatus !== "paid" &&
    reserva.paymentStatus !== "aprovado" &&
    !isPast;

  return (
    <>
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
            <h3 className="font-semibold text-gray-900 truncate">
              {reserva.barbearia?.nome ?? "Barbearia não identificada"}
            </h3>

            <p className="text-sm text-gray-600 truncate">
              {reserva.servico?.nome ?? "Serviço"} — 💰 R${" "}
              {reserva.servico?.preco?.toFixed(2) ?? "0,00"}
            </p>

            <p className="text-xs text-gray-500">{data}</p>

            <p
              className={`flex items-center gap-1 text-xs font-medium ${color}`}
            >
              {icon}
              {label}
            </p>
          </div>
        </div>

        {/* Status de pagamento */}
        {paymentInfo &&
          reserva.paymentStatus !== "not_required" &&
          reserva.paymentStatus !== "pendente" && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${paymentInfo.tone}`}
            >
              {paymentInfo.icon}
              <div>
                <span>{paymentInfo.label}</span>
                {isPaymentExpiring && expiresInMinutes !== null && (
                  <span className="ml-2 opacity-80">
                    · ⏳ {expiresInMinutes} min restantes
                  </span>
                )}
              </div>
            </div>
          )}

        {/* P0-C: Instrução persistente de pagamento manual pendente (oculta se passada) */}
        {isManualPaymentPending && !isPast && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-700 leading-relaxed">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold">Pagamento manual pendente</p>
              <p className="mt-1">
                Realize o pagamento diretamente à barbearia e aguarde a
                confirmação do recebimento pelo estabelecimento.
              </p>
              {reserva.barbearia?.telefone1 && (
                <p className="mt-1 font-medium">
                  📞 Contato: {reserva.barbearia.telefone1}
                </p>
              )}
              <p className="mt-1 opacity-75">
                O Doodads não processa pagamentos nem recebe valores.
              </p>
            </div>
          </div>
        )}

        {/* E3.2: Badge "Horário já passou" para reservas passadas pendentes */}
        {isPast && reserva.status === "pendente" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Horário já passou
          </div>
        )}

        {/* Motivo do cancelamento */}
        {reserva.status === "cancelado" && reserva.cancelReason && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Motivo: {reserva.cancelReason}</span>
          </div>
        )}

        {/* Botão cancelar */}
        {canCancel && (
          <button
            id={`cancel-reserva-${reserva._id}`}
            onClick={() => setShowCancelModal(true)}
            disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg py-2 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition"
          >
            {cancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            {cancelling ? "Cancelando..." : "Cancelar Reserva"}
          </button>
        )}
      </div>

      {/* Modal de cancelamento */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancelar Reserva"
        message={`Tem certeza que deseja cancelar a reserva de "${reserva.servico?.nome || "Serviço"}" em ${reserva.barbearia?.nome || "barbearia"}?\n\nEsta ação não pode ser desfeita.`}
        confirmLabel="Cancelar Reserva"
        cancelLabel="Voltar"
        tone="danger"
        showReasonField={true}
        reasonPlaceholder="Motivo do cancelamento (opcional)..."
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelModal(false)}
      />
    </>
  );
}
