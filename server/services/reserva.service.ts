import { reservaRepository } from "../repositories/reserva.repository";
import { reservaPolicy } from "../policies/reserva.policy";
import { AppError } from "../errors/AppError";
import { termsAcceptanceService, CreateTermsAcceptanceInput } from "./termsAcceptance.service";
import { termsVersionRepository } from "../repositories/termsVersion.repository";
import { bookingPolicyService } from "./bookingPolicy.service";
import { ITermsAcceptance } from "../models/TermsAcceptance";
import { IReserva } from "../models/Reserva";
import { bookingPaymentManualService } from "./bookingPaymentManual.service";
import { IBookingPayment } from "../models/BookingPayment";

/**
 * Input de aceite de termos vindo do request do cliente.
 * Campos mínimos — o backend monta o snapshot server-owned.
 */
export interface AcceptedTermsInput {
  termsVersionId: string;
  acceptedTermsCheckbox: boolean;
  source: "web" | "mobile" | "admin";
  locale?: string;
}

/**
 * Mapa legível de refundPolicy para resumo de snapshot.
 */
const REFUND_POLICY_SUMMARIES: Record<string, string> = {
  full_refund_until_window: "Reembolso integral dentro da janela de cancelamento.",
  partial_refund_until_window: "Reembolso parcial dentro da janela de cancelamento.",
  no_refund_after_window: "Sem reembolso após a janela de cancelamento.",
  manual_review: "Reembolso sujeito a análise manual.",
};

/**
 * Mapa legível de noShowPolicy para resumo de snapshot.
 */
const NO_SHOW_POLICY_SUMMARIES: Record<string, string> = {
  mark_no_show_after_tolerance: "Marcado como não comparecimento após tolerância.",
  manual_review: "Não comparecimento encaminhado para análise manual.",
};

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

  /**
   * Cria reserva COM aceite de termos — retrocompatível.
   * Valida TermsVersion, monta snapshot server-owned e registra TermsAcceptance.
   * O fluxo antigo (criarReserva) continua disponível quando acceptedTerms é omitido.
   */
  async criarReservaComAceite(
    usuarioId: string,
    barbearia: string,
    servico: string,
    dataHora: string,
    valor: number | undefined,
    acceptedTerms: AcceptedTermsInput,
    clientIp?: string,
    userAgent?: string
  ): Promise<{ reserva: IReserva; termsAcceptance: ITermsAcceptance; bookingPayment?: IBookingPayment }> {
    // 1. Validar checkbox explícito
    if (acceptedTerms.acceptedTermsCheckbox !== true) {
      throw new AppError(
        "O aceite dos termos deve ser explicitamente confirmado.",
        400,
        "TERMS_CHECKBOX_NOT_ACCEPTED"
      );
    }

    // 2. Validar TermsVersion
    const termsVersion = await termsVersionRepository.findById(acceptedTerms.termsVersionId);
    if (!termsVersion) {
      throw new AppError(
        "Versão de termos não encontrada.",
        404,
        "TERMS_VERSION_NOT_FOUND"
      );
    }

    if (!termsVersion.isActive) {
      throw new AppError(
        "A versão de termos informada não está mais ativa.",
        409,
        "TERMS_VERSION_INACTIVE"
      );
    }

    if (termsVersion.type !== "booking_payment_terms") {
      throw new AppError(
        "A versão de termos não é do tipo correto para reservas.",
        400,
        "TERMS_VERSION_TYPE_MISMATCH"
      );
    }

    // 3. Criar reserva usando fluxo existente
    const reserva = await this.criarReserva(usuarioId, barbearia, servico, dataHora, valor);

    // 4. Resolver dados server-owned para snapshot
    const servicoObj = await reservaRepository.checkServicoExists(servico, barbearia);
    const policy = await bookingPolicyService.getActiveOrDefaultPolicy(barbearia);

    const priceCents = Math.round((servicoObj?.preco || 0) * 100);
    const checkboxLabelSnapshot = `Li e aceito os ${termsVersion.title} (versão ${termsVersion.version}).`;
    const acceptanceTextSnapshot = termsVersion.content;

    // 5. Montar input do TermsAcceptance com campos server-owned
    const taInput: CreateTermsAcceptanceInput = {
      reservaId: reserva._id.toString(),
      barbeariaId: barbearia,
      userId: usuarioId,
      termsVersionId: termsVersion._id.toString(),
      acceptedAt: new Date(),
      checkboxLabelSnapshot,
      acceptanceTextSnapshot,
      serviceSnapshot: {
        servicoNome: servicoObj?.nome || "Serviço",
        priceCents,
        scheduledAt: new Date(dataHora),
        durationMinutes: servicoObj?.duracaoMin,
        arrivalToleranceMinutes: policy.arrivalToleranceMinutes,
        paymentExpirationMinutes: policy.paymentExpirationMinutes,
        cancellationWindowHours: policy.cancellationWindowHours,
        refundPolicySummary: REFUND_POLICY_SUMMARIES[policy.refundPolicy] || "Consulte as políticas da barbearia.",
        noShowPolicySummary: NO_SHOW_POLICY_SUMMARIES[policy.noShowPolicy] || "Consulte as políticas da barbearia.",
      },
      clientIp,
      userAgent,
      source: acceptedTerms.source,
      locale: acceptedTerms.locale || "pt-BR",
    };

    // 6. Criar TermsAcceptance snapshot
    const termsAcceptance = await termsAcceptanceService.createTermsAcceptanceSnapshot(taInput);

    let bookingPayment: IBookingPayment | undefined;

    // 7. Se a BookingPolicy exigir pré-pagamento, cria o BookingPayment manual pending
    if (policy.requirePrepayment) {
      const paymentExpirationMinutes = policy.paymentExpirationMinutes || 15;
      const expiresAt = new Date(Date.now() + paymentExpirationMinutes * 60000);

      bookingPayment = await bookingPaymentManualService.createManualBookingPayment({
        reservaId: reserva._id.toString(),
        barbeariaId: barbearia,
        amountCents: priceCents,
        expiresAt,
        idempotencyKey: `manual-payment-${reserva._id.toString()}`,
      });

      // Atualiza a reserva com informações de pagamento
      reserva.paymentRequired = true;
      reserva.paymentStatus = "pending";
      reserva.bookingPaymentId = bookingPayment._id as any;
      reserva.paymentExpiresAt = expiresAt;

      await reservaRepository.save(reserva);
    }

    return { reserva, termsAcceptance, bookingPayment };
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

