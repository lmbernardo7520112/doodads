import mongoose from "mongoose";
import { bookingPaymentRepository } from "../repositories/bookingPayment.repository";
import { IBookingPayment } from "../models/BookingPayment";
import { AppError } from "../errors/AppError";

export interface CreateManualBookingPaymentInput {
  reservaId: string;
  barbeariaId: string;
  amountCents: number;
  expiresAt: Date;
  idempotencyKey?: string;
  metadataSafe?: Record<string, unknown>;
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
}

export const bookingPaymentManualService = new BookingPaymentManualService();
