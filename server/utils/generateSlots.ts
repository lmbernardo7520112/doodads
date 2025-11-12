// ===============================================================
// 🕐 Geração de horários disponíveis para uma barbearia
// ---------------------------------------------------------------
// Lógica genérica: retorna intervalos de 30 min entre 09:00 e 17:00,
// removendo os horários já reservados.
// ===============================================================

// =============================================================
// 🕓 generateSlots.ts
// -------------------------------------------------------------
// Gera uma lista de horários disponíveis para uma barbearia e data.
// Usa grade 09:00–18:00 com passo de 30 min, pulando horários ocupados.
// =============================================================

import Reserva from "../models/Reserva"; // ✅ import default (não há named export)
import Servico from "../models/Servico";

/**
 * Gera horários disponíveis para uma barbearia e data.
 * @param barbeariaId ID da barbearia (ObjectId)
 * @param servicoId ID do serviço
 * @param date Data no formato YYYY-MM-DD
 * @returns Lista de horários livres ["09:00", "09:30", ...]
 */
export async function generateSlots(
  barbeariaId: string,
  servicoId: string,
  date: string
): Promise<string[]> {
  // 1️⃣ Busca o serviço para saber duração
  const servico = await Servico.findById(servicoId);
  if (!servico) return [];

  const duracao = servico.duracaoMin || 30; // duração padrão 30 min

  // 2️⃣ Define grade base (09h até 18h)
  const inicio = 9 * 60;
  const fim = 18 * 60;
  const step = 30; // passo base

  const todos: string[] = [];
  for (let m = inicio; m + duracao <= fim; m += duracao) {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const min = String(m % 60).padStart(2, "0");
    todos.push(`${h}:${min}`);
  }

  // 3️⃣ Busca reservas existentes nesse dia
  const reservas = await Reserva.find({
    barbearia: barbeariaId,
    servico: servicoId,
    dataHora: {
      $gte: new Date(`${date}T00:00:00`),
      $lt: new Date(`${date}T23:59:59`),
    },
    status: { $ne: "cancelado" },
  });

  const ocupados = reservas.map((r) =>
    new Date(r.dataHora).toTimeString().slice(0, 5)
  );

  // 4️⃣ Remove horários conflitantes
  const livres = todos.filter((h) => !ocupados.includes(h));

  return livres;
}
