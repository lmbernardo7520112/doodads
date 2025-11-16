// =============================================================
// 🎉 pagamento-sucesso/page.tsx
// Confirmação do pagamento + atualização da reserva
// Agora redireciona para HOME após confirmar.
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useReservas } from "@/hooks/useReservas";

export default function PagamentoSucessoPage() {
  const search = useSearchParams();
  const router = useRouter();
  const reservaId = search?.get("reserva");

  // Agora useReservas retorna mutate corretamente
  const { mutate } = useReservas();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!reservaId) {
      toast.error("Reserva não informada.");
      setLoading(false);
      return;
    }

    let active = true;
    let attempts = 0;

    const MAX_ATTEMPTS = 12; // ~36s
    const INTERVAL = 3000;

    const pollReserva = async () => {
      try {
        const res = await api.get(`/reservas/${reservaId}`);
        if (!active) return;

        const r = res.data;
        setStatus(r.status);

        // SE JÁ CONFIRMADO, atualiza SWR e redireciona
        if (r.status === "confirmado" || r.paymentStatus === "aprovado") {
          toast.success("Pagamento confirmado! Atualizando...");

          // Atualiza lista de reservas na HOME
          mutate?.();

          setLoading(false);

          // Redirecionar para a HOME 🏠
          setTimeout(() => {
            router.push("/");
          }, 800);

          return;
        }
      } catch (err) {
        // erro temporário → ignora e continua polling
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setLoading(false);
        toast("Pagamento recebido, mas ainda não atualizado. Tente novamente depois.", { icon: "⏳" });
        return;
      }

      setTimeout(pollReserva, INTERVAL);
    };

    pollReserva();

    return () => {
      active = false;
    };
  }, [reservaId, mutate, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Processando Pagamento</h1>

        {loading ? (
          <div>
            <p className="text-gray-700">Aguardando confirmação do pagamento...</p>
            <p className="mt-2 text-sm text-gray-500">
              Status atual da reserva: <strong>{status ?? "—"}</strong>
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">
              Se não atualizar automaticamente, volte para a Home e confira suas reservas.
            </p>

            <button
              className="px-4 py-2 bg-black text-white rounded w-full"
              onClick={() => {
                mutate?.();
                router.push("/");
              }}
            >
              Ir para Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
