import mongoose from "mongoose";
import { bookingPaymentRepository } from "../repositories/bookingPayment.repository";
import { reservaRepository } from "../repositories/reserva.repository";
import { IBookingPayment } from "../models/BookingPayment";
import { IReserva } from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import { AppError } from "../errors/AppError";

export interface CreateManualBookingPaymentInput {
  reservaId: string;
  barbeariaId: string;
  amountCents: number;
  expiresAt: Date;
  idempotencyKey?: string;
  metadataSafe?: Record<string, unknown>;
}

export interface ConfirmManualBookingPaymentInput {
  bookingPaymentId: string;
  userId: string;
  userTipo: "admin" | "barbeiro" | "cliente";
  confirmationNote?: string;
}

export interface ConfirmManualBookingPaymentResult {
  bookingPayment: IBookingPayment;
  reserva: IReserva;
}

export interface ExpireOverdueManualBookingPaymentInput {
  bookingPaymentId: string;
}

export interface ExpireOverdueManualBookingPaymentResult {
  bookingPayment: IBookingPayment;
  reserva: IReserva;
}

/**
 * Sanitiza o objeto metadataSafe removendo qualquer chave sensível ou suspeita.
 * Chaves que contenham palavras como: key, secret, token, password, pix, cpf, cnpj,
 * card, cvv, conta, banco, agencia, agency, etc., serão filtradas (case-insensitive).
 */
export function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sensitivePattern = /(key|secret|token|password|pix|cpf|cnpj|card|cvv|conta|banco|agency|agencia)/i;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitivePattern.test(key)) {
      // Ignora chave sensível
      continue;
    }

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recursivamente sanitiza objetos aninhados
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export class BookingPaymentManualService {
  async createManualBookingPayment(input: CreateManualBookingPaymentInput): Promise<IBookingPayment> {
    const { reservaId, barbeariaId, amountCents, expiresAt, idempotencyKey, metadataSafe } = input;

    // 1. Validações de ObjectId
    if (!reservaId || !mongoose.Types.ObjectId.isValid(reservaId)) {
      throw new AppError("ID da reserva inválido.", 400, "INVALID_RESERVA_ID");
    }

    if (!barbeariaId || !mongoose.Types.ObjectId.isValid(barbeariaId)) {
      throw new AppError("ID da barbearia inválido.", 400, "INVALID_BARBEARIA_ID");
    }

    // 2. Validação de amountCents (deve ser inteiro positivo > 0)
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw new AppError("O valor em centavos deve ser um número inteiro positivo.", 400, "INVALID_AMOUNT_CENTS");
    }

    // 3. Validação de expiresAt (deve ser futuro)
    if (!expiresAt || !(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new AppError("Data de expiração inválida.", 400, "INVALID_EXPIRES_AT");
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new AppError("A data de expiração deve ser no futuro.", 400, "EXPIRED_DATE_NOT_ALLOWED");
    }

    // 4. Idempotência por idempotencyKey
    if (idempotencyKey) {
      const existing = await bookingPaymentRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        // Verifica se os campos batem
        const matchReserva = existing.reservaId.toString() === reservaId;
        const matchBarbearia = existing.barbeariaId.toString() === barbeariaId;
        const matchAmount = existing.amountCents === amountCents;

        if (matchReserva && matchBarbearia && matchAmount) {
          // Idempotente: retorna o pagamento existente
          return existing;
        }

        // Conflito de reuso da mesma chave para dados diferentes
        throw new AppError(
          "Chave de idempotência já utilizada com parâmetros diferentes.",
          409,
          "IDEMPOTENCY_CONFLICT"
        );
      }
    }

    // 5. Sanitização de metadataSafe
    const sanitizedMetadata = sanitizeMetadata(metadataSafe);

    // 6. Criação do BookingPayment
    const bookingPayment = await bookingPaymentRepository.create({
      reservaId: new mongoose.Types.ObjectId(reservaId),
      barbeariaId: new mongoose.Types.ObjectId(barbeariaId),
      provider: "manual",
      amountCents,
      currency: "BRL",
      status: "pending",
      expiresAt,
      idempotencyKey,
      metadataSafe: sanitizedMetadata,
    });

    return bookingPayment;
  }

  /**
   * Confirmação manual de pagamento — backend-only, restrita a barbeiro/admin.
   *
   * Validações:
   * 1. bookingPaymentId válido
   * 2. Usuário autorizado (barbeiro ou admin, nunca cliente)
   * 3. Ownership da barbearia (barbeiro deve ser dono da barbearia associada)
   * 4. BookingPayment.provider = manual
   * 5. BookingPayment.status = pending (bloqueia paid/expired/cancelled/refunded/failed/manual_review)
   * 6. Reserva associada existente com paymentRequired = true e bookingPaymentId correspondente
   * 7. Pagamento tardio (expiresAt ultrapassado) → manual_review, não confirma automaticamente
   *
   * Ao confirmar:
   * - BookingPayment.status → paid
   * - BookingPayment.paidAt definido
   * - Reserva.paymentStatus → paid
   * - Reserva.confirmedAt definido
   * - Reserva.status mantido como "pendente" (retrocompatibilidade; mudança para "confirmado" em fase futura)
   */
  async confirmManualBookingPayment(
    input: ConfirmManualBookingPaymentInput
  ): Promise<ConfirmManualBookingPaymentResult> {
    const { bookingPaymentId, userId, userTipo, confirmationNote } = input;

    // 1. Validação de ObjectId
    if (!bookingPaymentId || !mongoose.Types.ObjectId.isValid(bookingPaymentId)) {
      throw new AppError("ID do pagamento inválido.", 400, "INVALID_BOOKING_PAYMENT_ID");
    }

    // 2. Autorização: apenas barbeiro ou admin
    if (userTipo === "cliente") {
      throw new AppError(
        "Clientes não podem confirmar pagamentos.",
        403,
        "CLIENT_CANNOT_CONFIRM_PAYMENT"
      );
    }

    if (!["barbeiro", "admin"].includes(userTipo)) {
      throw new AppError(
        "Usuário não autorizado a confirmar pagamentos.",
        403,
        "UNAUTHORIZED_CONFIRM_PAYMENT"
      );
    }

    // 3. Buscar BookingPayment
    const bookingPayment = await bookingPaymentRepository.findById(bookingPaymentId);
    if (!bookingPayment) {
      throw new AppError("Pagamento não encontrado.", 404, "BOOKING_PAYMENT_NOT_FOUND");
    }

    // 4. Provider deve ser manual
    if (bookingPayment.provider !== "manual") {
      throw new AppError(
        "Apenas pagamentos manuais podem ser confirmados por esta operação.",
        400,
        "PROVIDER_NOT_MANUAL"
      );
    }

    // 5. Status deve ser pending (bloquear todos os outros)
    if (bookingPayment.status !== "pending") {
      const codeMap: Record<string, string> = {
        paid: "ALREADY_PAID",
        expired: "PAYMENT_EXPIRED",
        cancelled: "PAYMENT_CANCELLED",
        refunded: "PAYMENT_REFUNDED",
        failed: "PAYMENT_FAILED",
        manual_review: "PAYMENT_UNDER_REVIEW",
      };
      throw new AppError(
        `Pagamento não pode ser confirmado: status atual é "${bookingPayment.status}".`,
        409,
        codeMap[bookingPayment.status] || "INVALID_PAYMENT_STATUS"
      );
    }

    // 6. Ownership: verificar que o usuário pertence à barbearia
    const barbearia = await Barbearia.findById(bookingPayment.barbeariaId);
    if (!barbearia) {
      throw new AppError("Barbearia associada ao pagamento não encontrada.", 404, "BARBEARIA_NOT_FOUND");
    }

    if (userTipo === "barbeiro") {
      const barbeiroDaBarbearia = barbearia.barbeiro?.toString();
      if (barbeiroDaBarbearia !== userId) {
        throw new AppError(
          "Você não tem permissão para confirmar pagamentos desta barbearia.",
          403,
          "OWNERSHIP_MISMATCH"
        );
      }
    }
    // admin pode confirmar qualquer barbearia

    // 7. Buscar Reserva associada
    const reserva = await reservaRepository.findByIdRaw(bookingPayment.reservaId.toString());
    if (!reserva) {
      throw new AppError(
        "Reserva associada ao pagamento não encontrada.",
        404,
        "RESERVA_NOT_FOUND"
      );
    }

    // 8. Validar consistência Reserva ↔ BookingPayment
    if (!reserva.paymentRequired) {
      throw new AppError(
        "A reserva associada não requer pagamento.",
        409,
        "RESERVA_PAYMENT_NOT_REQUIRED"
      );
    }

    if (!reserva.bookingPaymentId || reserva.bookingPaymentId.toString() !== bookingPaymentId) {
      throw new AppError(
        "O pagamento informado não corresponde à reserva.",
        409,
        "BOOKING_PAYMENT_MISMATCH"
      );
    }

    // 9. Verificar expiração → manual_review conservador
    if (bookingPayment.expiresAt && bookingPayment.expiresAt.getTime() < Date.now()) {
      // Pagamento tardio: transicionar para manual_review em vez de confirmar
      await bookingPaymentRepository.updateStatus(
        bookingPaymentId,
        "manual_review",
        { metadataSafe: { ...bookingPayment.metadataSafe as Record<string, unknown>, lateConfirmationAttemptAt: new Date().toISOString(), lateConfirmationBy: userId } }
      );

      throw new AppError(
        "Pagamento expirado. Encaminhado para análise manual.",
        409,
        "PAYMENT_EXPIRED_LATE_CONFIRMATION"
      );
    }

    // 10. Confirmar: atualizar BookingPayment
    const now = new Date();
    const updatedPayment = await bookingPaymentRepository.updateStatus(
      bookingPaymentId,
      "paid",
      {
        paidAt: now,
        metadataSafe: {
          ...bookingPayment.metadataSafe as Record<string, unknown>,
          confirmedBy: userId,
          confirmedByTipo: userTipo,
          ...(confirmationNote ? { confirmationNote: confirmationNote.substring(0, 500) } : {}),
        },
      }
    );

    if (!updatedPayment) {
      throw new AppError("Falha ao atualizar o pagamento.", 500, "PAYMENT_UPDATE_FAILED");
    }

    // 11. Atualizar Reserva
    reserva.paymentStatus = "paid";
    reserva.confirmedAt = now;
    // Nota: status principal da Reserva mantido como "pendente" para retrocompatibilidade.
    // A transição para "confirmado" será implementada em fase futura quando
    // o fluxo completo estiver validado end-to-end.

    const updatedReserva = await reservaRepository.save(reserva);

    return {
      bookingPayment: updatedPayment,
      reserva: updatedReserva,
    };
  }

  /**
   * Expiração controlada de BookingPayment manual pending vencido — backend-only.
   *
   * Regra de domínio pura (sem cron/job/scheduler/rota):
   * 1. bookingPaymentId válido
   * 2. BookingPayment.provider = manual
   * 3. BookingPayment.status = pending
   * 4. BookingPayment.expiresAt no passado
   * 5. Reserva associada existente com paymentRequired = true e bookingPaymentId correspondente
   *
   * Ao expirar:
   * - BookingPayment.status → expired
   * - Reserva.paymentStatus → expired
   * - Reserva.status principal preservado (sem alteração indevida)
   * - Metadata com audit trail mínimo e seguro
   */
  async expireOverdueManualBookingPayment(
    input: ExpireOverdueManualBookingPaymentInput
  ): Promise<ExpireOverdueManualBookingPaymentResult> {
    const { bookingPaymentId } = input;

    // 1. Validação de ObjectId
    if (!bookingPaymentId || !mongoose.Types.ObjectId.isValid(bookingPaymentId)) {
      throw new AppError("ID do pagamento inválido.", 400, "INVALID_BOOKING_PAYMENT_ID");
    }

    // 2. Buscar BookingPayment
    const bookingPayment = await bookingPaymentRepository.findById(bookingPaymentId);
    if (!bookingPayment) {
      throw new AppError("Pagamento não encontrado.", 404, "BOOKING_PAYMENT_NOT_FOUND");
    }

    // 3. Provider deve ser manual
    if (bookingPayment.provider !== "manual") {
      throw new AppError(
        "Apenas pagamentos manuais podem ser expirados por esta operação.",
        400,
        "PROVIDER_NOT_MANUAL"
      );
    }

    // 4. Status deve ser pending
    if (bookingPayment.status !== "pending") {
      const codeMap: Record<string, string> = {
        paid: "CANNOT_EXPIRE_PAID",
        expired: "ALREADY_EXPIRED",
        cancelled: "CANNOT_EXPIRE_CANCELLED",
        refunded: "CANNOT_EXPIRE_REFUNDED",
        failed: "CANNOT_EXPIRE_FAILED",
        manual_review: "CANNOT_EXPIRE_MANUAL_REVIEW",
      };
      throw new AppError(
        `Pagamento não pode ser expirado: status atual é "${bookingPayment.status}".`,
        409,
        codeMap[bookingPayment.status] || "INVALID_PAYMENT_STATUS"
      );
    }

    // 5. expiresAt deve estar no passado
    if (!bookingPayment.expiresAt) {
      throw new AppError(
        "Pagamento sem data de expiração definida.",
        400,
        "NO_EXPIRES_AT"
      );
    }

    if (bookingPayment.expiresAt.getTime() >= Date.now()) {
      throw new AppError(
        "Pagamento ainda não venceu. A expiração só pode ocorrer após expiresAt.",
        409,
        "NOT_YET_EXPIRED"
      );
    }

    // 6. Buscar Reserva associada
    const reserva = await reservaRepository.findByIdRaw(bookingPayment.reservaId.toString());
    if (!reserva) {
      throw new AppError(
        "Reserva associada ao pagamento não encontrada.",
        404,
        "RESERVA_NOT_FOUND"
      );
    }

    // 7. Validar consistência Reserva ↔ BookingPayment
    if (!reserva.paymentRequired) {
      throw new AppError(
        "A reserva associada não requer pagamento.",
        409,
        "RESERVA_PAYMENT_NOT_REQUIRED"
      );
    }

    if (!reserva.bookingPaymentId || reserva.bookingPaymentId.toString() !== bookingPaymentId) {
      throw new AppError(
        "O pagamento informado não corresponde à reserva.",
        409,
        "BOOKING_PAYMENT_MISMATCH"
      );
    }

    // 8. Expirar: atualizar BookingPayment
    const now = new Date();
    const updatedPayment = await bookingPaymentRepository.updateStatus(
      bookingPaymentId,
      "expired",
      {
        metadataSafe: {
          ...bookingPayment.metadataSafe as Record<string, unknown>,
          expiredAt: now.toISOString(),
          expirationReason: "overdue_manual_payment",
        },
      }
    );

    if (!updatedPayment) {
      throw new AppError("Falha ao atualizar o pagamento.", 500, "PAYMENT_UPDATE_FAILED");
    }

    // 9. Atualizar Reserva
    reserva.paymentStatus = "expired";
    // Nota: status principal da Reserva preservado (sem alteração indevida).
    // A decisão sobre cancelamento automático da reserva será em fase futura.

    const updatedReserva = await reservaRepository.save(reserva);

    return {
      bookingPayment: updatedPayment,
      reserva: updatedReserva,
    };
  }
}

export const bookingPaymentManualService = new BookingPaymentManualService();

