//client/components/ui/ReservaModal.tsx

// =============================================================
// client/components/ui/ReservaModal.tsx
// -------------------------------------------------------------
// Modal para criação de reserva — spinner no botão Confirmar
// e uso de toast (react-hot-toast) em vez de alert()
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Servico } from "@/types/Servico";

interface ReservaModalProps {
  open: boolean;
  onClose: () => void;
  barbeariaId: string;
  servico: Servico;
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

  // mínimo: data de hoje (formato YYYY-MM-DD)
  const minDate = new Date().toISOString().split("T")[0];

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
      .then((res) => setSlots(Array.isArray(res.data.slots) ? res.data.slots : []))
      .catch(() => toast.error("Erro ao carregar horários disponíveis."))
      .finally(() => setLoading(false));
  }, [date, barbeariaId, servico._id]);

  const handleConfirmar = async () => {
    if (!date || !selectedSlot) {
      toast("Escolha uma data e um horário antes de confirmar.", { icon: "⚠️" });
      return;
    }

    if (!token) {
      toast.error("Você precisa estar autenticado para agendar.");
      return;
    }

    try {
      setSaving(true);
      // cria objeto Date com timezone local → enviamos ISO para o backend
      const dateHora = new Date(`${date}T${selectedSlot}:00`);
      const payload = {
        barbearia: barbeariaId,
        servico: servico._id,
        dataHora: dateHora.toISOString(),
      };

      const res = await api.post("/reservas", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Se backend retornar a reserva, podemos exibir detalhes adicionais
      toast.success(res.data?.message || "Reserva criada com sucesso! 🎉");

      // opcional: mutate SWR ou atualizar lista localmente
      onClose();
    } catch (err: any) {
      console.error("❌ Erro ao confirmar reserva:", err);
      const msg = err?.response?.data?.message || "Falha ao criar reserva.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg space-y-5">
          <Dialog.Title className="text-xl font-semibold text-gray-800">
            Agendar — {servico.nome}
          </Dialog.Title>

          {/* Data */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 text-gray-600">
              <CalendarIcon size={16} /> Escolha a data
            </label>
            <input
              type="date"
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
                <p className="text-gray-500 text-sm">Carregando horários...</p>
              ) : slots.length === 0 ? (
                <p className="text-gray-400 italic text-sm">Nenhum horário disponível.</p>
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

          {/* Confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={saving}
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
