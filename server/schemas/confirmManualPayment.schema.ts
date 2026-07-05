import { z } from "zod";

/**
 * Schema Zod estrito para confirmação manual de pagamento.
 *
 * Params: bookingPaymentId (ObjectId hex24).
 * Body: apenas confirmationNote opcional (max 500 chars).
 * .strict() rejeita qualquer campo adicional (mass assignment protection).
 *
 * Campos server-owned rejeitados implicitamente por .strict():
 *   status, paymentStatus, paidAt, amountCents, provider,
 *   bookingPaymentId (body), barbeariaId, reservaId, pixKey,
 *   webhook, qr, secret, token, etc.
 */
export const confirmManualPaymentSchema = z.object({
  params: z.object({
    bookingPaymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID do pagamento inválido"),
  }).strict(),

  body: z.object({
    confirmationNote: z
      .string()
      .max(500, "Nota de confirmação deve ter no máximo 500 caracteres")
      .optional(),
  }).strict(),
});
