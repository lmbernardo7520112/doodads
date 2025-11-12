"use client";


import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { CalendarIcon, Clock } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Servico } from "@/types/Servico"; // ✅ Importa o tipo global

interface ReservaModalProps {
  open: boolean;
  onClose: () => void;
  barbeariaId: string;
  servico: Servico; // ✅ agora alinhado
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

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    api
      .get(`/reservas/${barbeariaId}/slots`, {
        params: { date, servicoId: servico._id },
      })
      .then((res) => setSlots(res.data.slots))
      .catch((err) => console.error("Erro ao buscar slots:", err))
      .finally(() => setLoading(false));
  }, [date]);

  const handleConfirmar = async () => {
    if (!date || !selectedSlot) {
      alert("Escolha uma data e um horário antes de confirmar!");
      return;
    }

    try {
      setSaving(true);
      const dataHora = new Date(`${date}T${selectedSlot}:00`);
      await api.post(
        "/reservas",
        {
          barbearia: barbeariaId,
          servico: servico._id,
          dataHora,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Reserva confirmada com sucesso!");
      onClose();
    } catch (err: any) {
      console.error("❌ Erro ao confirmar reserva:", err);
      alert(err.response?.data?.error || "Erro ao confirmar reserva.");
    } finally {
      setSaving(false);
    }
  };

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
              min={new Date().toISOString().split("T")[0]}
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
                <p className="text-gray-400 italic text-sm">
                  Nenhum horário disponível para esta data.
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

          {/* Confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={saving}
            className="w-full bg-black text-white rounded-lg py-2 mt-3 font-medium hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Confirmar Reserva"}
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
