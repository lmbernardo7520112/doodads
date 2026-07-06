// =============================================================
// 🎉 pagamento-sucesso/page.tsx — versão FINAL e robusta
// Corrige 100% do problema de SWR stale data após pagamento
// Suspense boundary adicionada para Next.js 15 compatibility
// =============================================================

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useReservas } from "@/hooks/useReservas";
import { mutate as globalMutate } from "swr";

function PagamentoSucessoContent() {
  const search = useSearchParams();
  const router = useRouter();
  const reservaId = search?.get("reserva");

  const { mutate } = useReservas({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  // Debug único: marcar o início do fluxo
  useEffect(() => {
    console.debug("⚡[PagamentoSucesso] MONTADO — reserva =", reservaId);
  }, []);

  useEffect(() => {
    if (!reservaId) {
      toast.error("Reserva não informada.");
      setLoading(false);
      return;
    }

    let active = true;
    let attempts = 0;

    const MAX_ATTEMPTS = 12; // 36s
    const INTERVAL = 3000;

    console.debug("⏳ [PagamentoSucesso] Iniciando polling da reserva…");

    const pollReserva = async () => {
      if (!active) return;

      console.debug(
        `🔎 [PagamentoSucesso] Poll tentativa ${attempts + 1}/${MAX_ATTEMPTS}`
      );

      try {
        const res = await api.get(`/reservas/${reservaId}?t=${Date.now()}`);
        const r = res.data;

        console.debug(
          `📥 [PagamentoSucesso] status atual: status=${r.status} paymentStatus=${r.paymentStatus}`
        );

        setStatus(r.status);

        const aprovado =
          r.status === "confirmado" || r.paymentStatus === "aprovado";

        if (aprovado) {
          console.debug("🎉 [PagamentoSucesso] Pagamento confirmado no backend!");

          toast.success("Pagamento confirmado!");

          // ======================================================
          // 🔥 Correção principal: sincronizar SWR
          // ======================================================
          console.debug("🔄 [PagamentoSucesso] SWR mutate local…");
          await mutate?.();

          console.debug("🌍 [PagamentoSucesso] SWR mutate global /reservas/minhas…");
          await globalMutate("/reservas/minhas");

          console.debug("🌀 [PagamentoSucesso] router.refresh()");
          router.refresh();

          setLoading(false);

          setTimeout(() => {
            console.debug("🏠 [PagamentoSucesso] Redirecionando para HOME");
            router.push("/");
          }, 800);

          return;
        }
      } catch (err) {
        console.error("❌ [PagamentoSucesso] Erro no GET reserva:", err);
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        console.warn("⏳ [PagamentoSucesso] Timeout esperando confirmação");

        toast("Pagamento recebido, mas ainda não atualizado no app. Tente mais tarde.", {
          icon: "⏳",
        });

        setLoading(false);
        return;
      }

      setTimeout(pollReserva, INTERVAL);
    };

    pollReserva();

    return () => {
      active = false;
      console.debug("🛑 [PagamentoSucesso] desmontado — polling cancelado.");
    };
  }, [reservaId, mutate, router]);

  // =============================================================
  // UI
  // =============================================================
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
              Caso não atualize automaticamente, volte para a Home e confira suas reservas.
            </p>

            <button
              className="px-4 py-2 bg-black text-white rounded w-full"
              onClick={async () => {
                console.debug("🔄 [PagamentoSucesso] Botão HOME → sincronizando SWR");
                await mutate?.();
                await globalMutate("/reservas/minhas");
                router.refresh();
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

export default function PagamentoSucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <p className="text-gray-500">Carregando...</p>
        </div>
      }
    >
      <PagamentoSucessoContent />
    </Suspense>
  );
}
