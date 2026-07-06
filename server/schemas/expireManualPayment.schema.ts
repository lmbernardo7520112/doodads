import { z } from "zod";

/**
 * Schema Zod estrito para expiração manual/administrativa de pagamento.
 *
 * Params: bookingPaymentId (ObjectId hex24).
 * Body: vazio ou com expirationNote opcional (max 500 chars).
 * .strict() rejeita qualquer campo adicional (mass assignment protection).
 *
 * Campos server-owned rejeitados implicitamente por .strict():
 *   status, paymentStatus, paidAt, expiresAt, amountCents, provider,
 *   bookingPaymentId (body), barbeariaId, reservaId, pixKey,
 *   webhook, qr, secret, token, etc.
 */
export const expireManualPaymentSchema = z.object({
  params: z.object({
    bookingPaymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID do pagamento inválido"),
  }).strict(),

  body: z.object({
    expirationNote: z
      .string()
      .max(500, "Nota de expiração deve ter no máximo 500 caracteres")
      .optional(),
  }).strict(),
});
