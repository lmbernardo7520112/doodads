// =============================================================
// client/components/ui/ReservaModal.tsx
// -------------------------------------------------------------
// Modal para criação de reserva com aceite de termos,
// seleção de data/horário e instrução de pagamento manual Pix.
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  CalendarIcon,
  Clock,
  Loader2,
  CheckCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Servico } from "@/types/Servico";

interface TermsVersion {
  _id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  effectiveFrom: string;
}

interface ReservaModalProps {
  open: boolean;
  onClose: () => void;
  barbeariaId: string;
  servico: Servico;
}

interface PaymentInstruction {
  message: string;
  expiresInMinutes: number;
}

interface ReservaResponse {
  message: string;
  reserva: any;
  termsAcceptance?: any;
  bookingPayment?: any;
  paymentInstruction?: PaymentInstruction;
  paymentStatusPresentation?: any;
  reservaStatusPresentation?: any;
}

export default function ReservaModal({
  open,
  onClose,
  barbeariaId,
  servico,
}: ReservaModalProps) {
  const { token } = useAuth();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Termos
  const [terms, setTerms] = useState<TermsVersion | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsContent, setShowTermsContent] = useState(false);

  // Resultado pós-reserva (instrução de pagamento)
  const [result, setResult] = useState<ReservaResponse | null>(null);

  // mínimo: data de hoje (formato YYYY-MM-DD)
  const minDate = new Date().toISOString().split("T")[0];

  // =============================================================
  // 📜 Buscar termos ativos ao abrir o modal
  // =============================================================
  useEffect(() => {
    if (!open) {
      // Reset ao fechar
      setDate("");
      setSlots([]);
      setSelectedSlot("");
      setAcceptedTerms(false);
      setShowTermsContent(false);
      setResult(null);
      return;
    }

    const fetchTerms = async () => {
      try {
        setLoadingTerms(true);
        const res = await api.get("/terms/active", {
          params: { type: "booking_payment_terms" },
        });
        setTerms(res.data);
      } catch (err) {
        console.warn("⚠️ Termos não encontrados (reserva sem aceite):", err);
        setTerms(null);
      } finally {
        setLoadingTerms(false);
      }
    };

    fetchTerms();
  }, [open]);

  // =============================================================
  // ⏰ Buscar slots disponíveis ao selecionar data
  // =============================================================
  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }

    setLoading(true);
    api
      .get(`/reservas/${barbeariaId}/slots`, {
        params: { date, servicoId: servico._id },
      })
      .then((res) =>
        setSlots(Array.isArray(res.data.slots) ? res.data.slots : [])
      )
      .catch(() => toast.error("Erro ao carregar horários disponíveis."))
      .finally(() => setLoading(false));
  }, [date, barbeariaId, servico._id]);

  // =============================================================
  // ✅ Confirmar reserva
  // =============================================================
  const handleConfirmar = async () => {
    if (!date || !selectedSlot) {
      toast("Escolha uma data e um horário antes de confirmar.", {
        icon: "⚠️",
      });
      return;
    }

    if (!token) {
      toast.error("Você precisa estar autenticado para agendar.");
      return;
    }

    // Se termos foram carregados, exigir aceite
    if (terms && !acceptedTerms) {
      toast("Você precisa aceitar os termos para continuar.", { icon: "📜" });
      return;
    }

    try {
      setSaving(true);
      const dateHora = new Date(`${date}T${selectedSlot}:00`);

      const payload: any = {
        barbearia: barbeariaId,
        servico: servico._id,
        dataHora: dateHora.toISOString(),
        valor: servico.preco,
      };

      // Incluir aceite de termos se disponível
      if (terms && acceptedTerms) {
        payload.acceptedTerms = {
          termsVersionId: terms._id,
          acceptedTermsCheckbox: true,
          source: "web",
          locale: "pt-BR",
        };
      }

      const res = await api.post("/reservas", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: ReservaResponse = res.data;

      // Se tem instrução de pagamento, exibir no modal
      if (data.bookingPayment || data.paymentInstruction) {
        setResult(data);
        toast.success("Reserva criada! Veja as instruções de pagamento.");
      } else {
        toast.success(data.message || "Reserva criada com sucesso! 🎉");
        onClose();
      }
    } catch (err: any) {
      console.error("❌ Erro ao confirmar reserva:", err);
      const msg = err?.response?.data?.message || "Falha ao criar reserva.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // =============================================================
  // 💳 Tela de instrução de pagamento (pós-reserva)
  // =============================================================
  if (result) {
    return (
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg space-y-5">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-gray-800">
                Reserva Confirmada!
              </Dialog.Title>
            </div>

            {/* Status da reserva */}
            {result.reservaStatusPresentation && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  📋 Status da reserva
                </p>
                <p className="text-sm text-gray-600">
                  {result.reservaStatusPresentation.label} — {result.reservaStatusPresentation.description}
                </p>
              </div>
            )}

            {/* Instrução de pagamento */}
            {result.paymentInstruction && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <p className="font-semibold text-amber-800 text-sm">
                    Pagamento Pendente
                  </p>
                </div>
                <p className="text-sm text-amber-700">
                  {result.paymentInstruction.message}
                </p>
                <p className="text-xs text-amber-600 font-medium">
                  ⏳ Expira em {result.paymentInstruction.expiresInMinutes} minutos
                </p>
              </div>
            )}

            {/* Status do pagamento */}
            {result.paymentStatusPresentation && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  💳 {result.paymentStatusPresentation.label}
                </p>
                <p className="text-xs text-gray-500">
                  {result.paymentStatusPresentation.description}
                </p>
              </div>
            )}

            {/* Valor */}
            {result.bookingPayment && (
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(result.bookingPayment.amountCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Valor a ser pago via Pix diretamente à barbearia
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-black text-white rounded-lg py-2 font-medium hover:bg-gray-800 transition"
            >
              Entendi, vou pagar
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  // =============================================================
  // 📋 Tela principal do modal (seleção de data/hora + termos)
  // =============================================================
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg space-y-5 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-gray-800">
            Agendar — {servico.nome}
          </Dialog.Title>

          {/* Preço e duração */}
          <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
            <span>💰 R$ {servico.preco?.toFixed(2)}</span>
            {servico.duracaoMin && <span>⏱️ {servico.duracaoMin} min</span>}
          </div>

          {/* Data */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 text-gray-600">
              <CalendarIcon size={16} /> Escolha a data
            </label>
            <input
              type="date"
              id="reserva-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              min={minDate}
            />
          </div>

          {/* Horários */}
          {date && (
            <div>
              <label className="text-sm font-medium flex items-center gap-2 text-gray-600 mb-1">
                <Clock size={16} /> Escolha o horário
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando horários...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-gray-400 italic text-sm">
                  Nenhum horário disponível.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm border transition ${
                        selectedSlot === slot
                          ? "bg-black text-white border-black"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Termos de aceite */}
          {terms && !loadingTerms && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                >
                  Li e aceito os{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsContent(!showTermsContent)}
                    className="text-black hover:text-gray-700 underline font-medium inline-flex items-center gap-1"
                  >
                    <FileText size={14} />
                    {terms.title}
                  </button>{" "}
                  (versão {terms.version}).
                </label>
              </div>

              {/* Conteúdo expandível dos termos */}
              {showTermsContent && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {terms.content}
                  </pre>
                </div>
              )}
            </div>
          )}

          {loadingTerms && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando termos...
            </div>
          )}

          {/* Confirmar */}
          <button
            id="confirm-reserva"
            onClick={handleConfirmar}
            disabled={saving || (terms !== null && !acceptedTerms)}
            className="w-full bg-black text-white rounded-lg py-2 mt-3 font-medium hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Confirmando..." : "Confirmar Reserva"}
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
