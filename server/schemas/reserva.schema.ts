import { z } from "zod";

/**
 * Sub-schema estrito de acceptedTerms.
 * Campos permitidos: termsVersionId, acceptedTermsCheckbox, source, locale.
 * .strict() rejeita qualquer campo adicional (mass assignment protection).
 *
 * Campos server-owned rejeitados explicitamente:
 *   serviceSnapshot, priceCents, durationMinutes, cancellationWindowHours,
 *   arrivalToleranceMinutes, paymentExpirationMinutes, refundPolicySummary,
 *   noShowPolicySummary, clientIpHash, userAgentHash, acceptedAt,
 *   barbeariaId, userId, checkboxLabelSnapshot, acceptanceTextSnapshot.
 */
const acceptedTermsSchema = z.object({
  termsVersionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID da versão de termos inválido"),
  acceptedTermsCheckbox: z.literal(true, {
    message: "O aceite dos termos deve ser explicitamente confirmado (true).",
  }),
  source: z.enum(["web", "mobile", "admin"], {
    message: "Source deve ser 'web', 'mobile' ou 'admin'.",
  }),
  locale: z.string().max(10, "Locale muito longo").optional(),
}).strict();

export const criarReservaSchema = z.object({
  body: z.object({
    barbearia: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID da barbearia inválido"),
    servico: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID do serviço inválido"),
    dataHora: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Data e hora inválidas",
    }),
    valor: z.number().positive("Valor deve ser positivo").optional(),
    acceptedTerms: acceptedTermsSchema.optional(),
  }).strict(),
});

export { acceptedTermsSchema };
