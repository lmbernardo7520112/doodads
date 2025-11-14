// =============================================================
// 🕓 server/utils/generateSlots.ts
// -------------------------------------------------------------
// Gera horários disponíveis (09:00–18:00) pulando os ocupados
// =============================================================

import Reserva from "../models/Reserva";
import Servico from "../models/Servico";

interface SlotParams {
  barbeariaId: string;
  servicoId: string;
  date: string; // formato 'YYYY-MM-DD'
}

/**
 * Gera uma lista de slots (strings "HH:MM") para o dia e serviço informado,
 * removendo qualquer horário já reservado (status diferente de "cancelado").
 *
 * Observações importantes:
 * - Bloqueamos reservas com qualquer status exceto "cancelado" (ou seja: "pendente" e "confirmado" bloqueiam).
 * - O cálculo é feito considerando o duracaoMin do serviço.
 */
export async function generateSlots({
  barbeariaId,
  servicoId,
  date,
}: SlotParams): Promise<{ slots: string[] }> {
  const servico = await Servico.findById(servicoId);
  if (!servico) return { slots: [] };

  const duracao = Number(servico.duracaoMin) || 30;

  const inicio = 9 * 60; // 09:00 em minutos
  const fim = 18 * 60; // 18:00 em minutos

  const todos: string[] = [];

  for (let m = inicio; m + duracao <= fim; m += duracao) {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const min = String(m % 60).padStart(2, "0");
    todos.push(`${h}:${min}`);
  }

  // limites do dia (usando UTC local naive; se sua aplicação exigir timezone explícito,
  // adaptar aqui para considerar o timezone do estabelecimento)
  const startDate = new Date(`${date}T00:00:00`);
  const endDate = new Date(`${date}T23:59:59`);

  const reservas = await Reserva.find({
    barbearia: barbeariaId,
    servico: servicoId,
    dataHora: {
      $gte: startDate,
      $lt: endDate,
    },
    // bloqueia qualquer reserva que não esteja cancelada
    status: { $ne: "cancelado" },
  }).sort({ dataHora: 1 });

  const ocupados = reservas.map((r) =>
    new Date(r.dataHora).toTimeString().slice(0, 5)
  );

  return { slots: todos.filter((h) => !ocupados.includes(h)) };
}

export default generateSlots;
