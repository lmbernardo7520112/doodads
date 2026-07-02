import { reservaRepository } from "../repositories/reserva.repository";
import { reservaPolicy } from "../policies/reserva.policy";

export class ReservaService {
  async getReservaById(id: string, usuarioId: string) {
    const reserva = await reservaRepository.findById(id);
    if (!reserva) throw new Error("NOT_FOUND");
    
    if (!reservaPolicy.canAccess(usuarioId, reserva)) {
      throw new Error("FORBIDDEN");
    }
    return reserva;
  }

  async listarMinhasReservas(usuarioId: string) {
    return reservaRepository.findMinhas(usuarioId);
  }

  async criarReserva(usuarioId: string, barbearia: string, servico: string, dataHora: string, valor?: number) {
    const exists = await reservaRepository.checkBarbeariaExists(barbearia);
    if (!exists) throw new Error("BARBEARIA_NOT_FOUND");

    const data = new Date(dataHora);
    if (isNaN(data.getTime())) throw new Error("INVALID_DATE");

    const conflito = await reservaRepository.findConflito(barbearia, servico, data);
    if (conflito) throw new Error("CONFLICT");

    return reservaRepository.create({
      usuario: usuarioId as any,
      barbearia: barbearia as any,
      servico: servico as any,
      dataHora: data,
      valor,
      status: "pendente",
      paymentStatus: "pendente"
    });
  }

  async cancelarReserva(id: string, usuarioId: string, usuarioTipo: string, reason?: string) {
    const reserva = await reservaRepository.findById(id);
    if (!reserva) throw new Error("NOT_FOUND_CANCEL"); // differentiation if needed, but not strictly needed

    if (!reservaPolicy.canCancel(usuarioId, usuarioTipo, reserva)) {
      throw new Error("FORBIDDEN_CANCEL");
    }

    if (reserva.status === "cancelado") {
      throw new Error("ALREADY_CANCELLED");
    }

    const isPrivileged = ["barbeiro", "admin", "staff"].includes(usuarioTipo);
    const cutoffMinutes = Number(process.env.CANCEL_CUTOFF_MINUTES || "60");
    const now = new Date();
    const diffMinutes = (new Date(reserva.dataHora).getTime() - now.getTime()) / 60000;

    if (diffMinutes < cutoffMinutes && !isPrivileged) {
      throw new Error("TOO_LATE");
    }

    reserva.status = "cancelado";
    reserva.canceladoEm = new Date();
    if (reason && reason.trim().length > 0) {
      reserva.cancelReason = reason.trim();
    }

    return reservaRepository.save(reserva);
  }

  async pagarReservaSimulado(id: string, usuarioId: string) {
    const reserva = await reservaRepository.findById(id);
    if (!reserva) throw new Error("NOT_FOUND");

    if (!reservaPolicy.canPay(usuarioId, reserva)) {
      throw new Error("FORBIDDEN_PAY");
    }

    if (reserva.status === "cancelado") {
      throw new Error("ALREADY_CANCELLED");
    }

    if (reserva.paymentStatus === "aprovado") {
      throw new Error("ALREADY_PAID");
    }

    reserva.paymentStatus = "aprovado";
    reserva.status = "confirmado";
    reserva.confirmadoEm = new Date();
    reserva.paymentId = "simulated-payment-" + reserva._id;

    return reservaRepository.save(reserva);
  }
}
export const reservaService = new ReservaService();
