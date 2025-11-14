// =============================================================
// 🧾 client/types/Reserva.ts
// -------------------------------------------------------------
// Tipagem compartilhada para reservas (frontend-safe)
// Mantém compatibilidade total com backend e componentes.
// =============================================================

import { IBarbearia } from "./Barbearia";
import { IUser } from "./User";
import { Servico } from "./Servico";

// -------------------------------------------------------------
// 🧠 Estrutura de reserva alinhada ao modelo do backend
// -------------------------------------------------------------
export interface IReserva {
  _id: string;

  usuario: IUser;
  barbearia: IBarbearia;

  // ✅ Garante que duracaoMin seja sempre número, evitando erro no AppointmentCard
  servico: Omit<Servico, "duracaoMin"> & { duracaoMin: number };

  dataHora: string;

  // 🟡 Status padronizado
  status: "pendente" | "confirmado" | "cancelado" | "finalizado";

  // 💰 Campos opcionais
  valor?: number;
  criadoEm: string;
  canceladoEm?: string;
}

// -------------------------------------------------------------
// 💡 Dica: caso o backend retorne reservas sem populates completos,
// use Partial<IBarbearia> ou Partial<Servico> para maior tolerância.
// Mas na configuração atual do backend (populate completo), não é necessário.
// -------------------------------------------------------------
