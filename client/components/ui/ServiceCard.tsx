//client/components/ui/ServiceCard.tsx

"use client";

import { useState } from "react";
import ReservaModal from "./ReservaModal";
import { Servico } from "@/types/Servico";

export default function ServiceCard({
  servico,
  barbeariaId,
}: {
  servico: Servico;
  barbeariaId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-lg transition">
        <h3 className="font-semibold text-gray-900">{servico.nome}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {servico.descricao ?? "Serviço profissional"}
        </p>
        <p className="text-sm text-gray-700">
          ⏱️ {servico.duracaoMin ? `${servico.duracaoMin} min` : "Duração não informada"} — 💰 R$ {servico.preco}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 w-full bg-emerald-600 text-white rounded-lg py-2 text-sm hover:bg-emerald-700 active:scale-[0.97] transition"
        >
          Reservar agora 💈
        </button>
      </div>

      <ReservaModal
        open={open}
        onClose={() => setOpen(false)}
        barbeariaId={barbeariaId}
        servico={servico}
      />
    </>
  );
}
