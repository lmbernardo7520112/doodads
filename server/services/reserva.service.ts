import { reservaRepository } from "../repositories/reserva.repository";
import { reservaPolicy } from "../policies/reserva.policy";
import { AppError } from "../errors/AppError";

export class ReservaService {
  async getReservaById(id: string, usuarioId: string) {
    const reserva = await reservaRepository.findById(id);
    if (!reserva) throw new AppError("Reserva não encontrada.", 404, "NOT_FOUND");
    
    if (!reservaPolicy.canAccess(usuarioId, reserva)) {
      throw new AppError("Acesso negado à reserva.", 403, "FORBIDDEN");
    }
    return reserva;
  }

  async listarMinhasReservas(usuarioId: string) {
    return reservaRepository.findMinhas(usuarioId);
  }

  async criarReserva(usuarioId: string, barbearia: string, servico: string, dataHora: string, valor?: number) {
    const exists = await reservaRepository.checkBarbeariaExists(barbearia);
    if (!exists) throw new AppError("Barbearia não encontrada.", 404, "BARBEARIA_NOT_FOUND");

    const servicoObj = await reservaRepository.checkServicoExists(servico, barbearia);
    if (!servicoObj) throw new AppError("Serviço não encontrado ou não pertence a esta barbearia.", 404, "SERVICO_NOT_FOUND");

    const data = new Date(dataHora);
    if (isNaN(data.getTime())) throw new AppError("Data inválida.", 400, "INVALID_DATE");

    if (data.getTime() < Date.now()) {
      throw new AppError("Não é possível criar reserva no passado.", 400, "PAST_DATE");
    }

    const duracaoMin = servicoObj.duracaoMin || 30;
    const dataFim = new Date(data.getTime() + duracaoMin * 60000);

    const conflito = await reservaRepository.findConflito(barbearia, data, dataFim);
    if (conflito) throw new AppError("Horário já reservado ou em conflito.", 409, "CONFLICT");

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
    if (!reserva) throw new AppError("Reserva não encontrada.", 404, "NOT_FOUND");

    if (!reservaPolicy.canCancel(usuarioId, usuarioTipo, reserva)) {
      throw new AppError("Você não pode cancelar esta reserva.", 403, "FORBIDDEN_CANCEL");
    }

    if (reserva.status === "cancelado") {
      throw new AppError("Esta reserva já está cancelada.", 400, "ALREADY_CANCELLED");
    }
    
    if (reserva.status === "finalizado") {
      throw new AppError("Esta reserva já foi finalizada e não pode ser cancelada.", 400, "ALREADY_FINALIZED");
    }

    if (reserva.paymentStatus === "aprovado") {
      throw new AppError("Reserva já paga, contate o suporte para cancelar.", 400, "ALREADY_PAID_CANCEL");
    }

    const isPrivileged = ["barbeiro", "admin", "staff"].includes(usuarioTipo);
    const cutoffMinutes = Number(process.env.CANCEL_CUTOFF_MINUTES || "60");
    const now = new Date();
    const diffMinutes = (new Date(reserva.dataHora).getTime() - now.getTime()) / 60000;

    if (diffMinutes < cutoffMinutes && !isPrivileged) {
      throw new AppError(`Cancelamento não permitido: só é possível cancelar até ${cutoffMinutes} minutos antes do horário.`, 400, "TOO_LATE");
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
    if (!reserva) throw new AppError("Reserva não encontrada.", 404, "NOT_FOUND");

    if (!reservaPolicy.canPay(usuarioId, reserva)) {
      throw new AppError("Você não pode pagar por esta reserva.", 403, "FORBIDDEN_PAY");
    }

    if (reserva.status === "cancelado") {
      throw new AppError("Esta reserva já está cancelada.", 400, "ALREADY_CANCELLED");
    }

    if (reserva.paymentStatus === "aprovado") {
      throw new AppError("Pagamento já aprovado.", 400, "ALREADY_PAID");
    }

    reserva.paymentStatus = "aprovado";
    reserva.status = "confirmado";
    reserva.confirmadoEm = new Date();
    reserva.paymentId = "simulated-payment-" + reserva._id;

    return reservaRepository.save(reserva);
  }
}
export const reservaService = new ReservaService();
