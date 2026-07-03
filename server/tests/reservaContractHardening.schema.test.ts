import { criarReservaSchema, acceptedTermsSchema } from "../schemas/reserva.schema";
import { ZodError } from "zod";
import mongoose from "mongoose";

/**
 * Testes de contrato Zod para criarReservaSchema — Phase C5.
 * Validam que o schema rejeita mass assignment, aceita input válido,
 * preserva retrocompatibilidade e bloqueia campos server-owned.
 */
describe("criarReservaSchema — Contract Hardening (Phase C5)", () => {
  const validObjectId = new mongoose.Types.ObjectId().toHexString();
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  function validBody(overrides?: Record<string, any>) {
    return {
      barbearia: validObjectId,
      servico: validObjectId,
      dataHora: futureDate,
      ...overrides,
    };
  }

  function validAcceptedTerms(overrides?: Record<string, any>) {
    return {
      termsVersionId: validObjectId,
      acceptedTermsCheckbox: true,
      source: "web" as const,
      locale: "pt-BR",
      ...overrides,
    };
  }

  // =====================================================
  // RETROCOMPATIBILIDADE — sem acceptedTerms
  // =====================================================

  describe("Retrocompatibilidade: sem acceptedTerms", () => {
    it("deve aceitar body válido sem acceptedTerms", () => {
      const result = criarReservaSchema.safeParse({ body: validBody() });
      expect(result.success).toBe(true);
    });

    it("deve aceitar body com valor opcional", () => {
      const result = criarReservaSchema.safeParse({ body: validBody({ valor: 50 }) });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar body sem barbearia", () => {
      const { barbearia, ...rest } = validBody();
      const result = criarReservaSchema.safeParse({ body: rest });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar body sem servico", () => {
      const { servico, ...rest } = validBody();
      const result = criarReservaSchema.safeParse({ body: rest });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar body sem dataHora", () => {
      const { dataHora, ...rest } = validBody();
      const result = criarReservaSchema.safeParse({ body: rest });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar campo desconhecido no body (strict)", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ campoInvalido: "hack" }),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
      }
    });
  });

  // =====================================================
  // acceptedTerms VÁLIDO
  // =====================================================

  describe("acceptedTerms válido", () => {
    it("deve aceitar acceptedTerms com todos campos obrigatórios", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms() }),
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar acceptedTerms sem locale (opcional)", () => {
      const { locale, ...rest } = validAcceptedTerms();
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: rest }),
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar source 'mobile'", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms({ source: "mobile" }) }),
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar source 'admin'", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms({ source: "admin" }) }),
      });
      expect(result.success).toBe(true);
    });
  });

  // =====================================================
  // VALIDAÇÃO DE CHECKBOX
  // =====================================================

  describe("Validação de checkbox", () => {
    it("deve rejeitar acceptedTermsCheckbox: false", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms({ acceptedTermsCheckbox: false }) }),
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar acceptedTermsCheckbox ausente", () => {
      const { acceptedTermsCheckbox, ...rest } = validAcceptedTerms();
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: rest }),
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar acceptedTermsCheckbox: 'true' (string)", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms({ acceptedTermsCheckbox: "true" }) }),
      });
      expect(result.success).toBe(false);
    });
  });

  // =====================================================
  // VALIDAÇÃO DE termsVersionId
  // =====================================================

  describe("Validação de termsVersionId", () => {
    it("deve rejeitar termsVersionId inválido (não ObjectId)", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms({ termsVersionId: "invalido" }) }),
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar termsVersionId ausente", () => {
      const { termsVersionId, ...rest } = validAcceptedTerms();
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: rest }),
      });
      expect(result.success).toBe(false);
    });
  });

  // =====================================================
  // VALIDAÇÃO DE SOURCE
  // =====================================================

  describe("Validação de source", () => {
    it("deve rejeitar source inválido", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: validAcceptedTerms({ source: "invalid_source" }) }),
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar source ausente", () => {
      const { source, ...rest } = validAcceptedTerms();
      const result = criarReservaSchema.safeParse({
        body: validBody({ acceptedTerms: rest }),
      });
      expect(result.success).toBe(false);
    });
  });

  // =====================================================
  // MASS ASSIGNMENT — campos server-owned rejeitados
  // =====================================================

  describe("Mass assignment: campos server-owned rejeitados pelo .strict()", () => {
    const serverOwnedFields = [
      { field: "serviceSnapshot", value: { servicoNome: "HACK", priceCents: 0 } },
      { field: "priceCents", value: 0 },
      { field: "durationMinutes", value: 999 },
      { field: "cancellationWindowHours", value: 0 },
      { field: "arrivalToleranceMinutes", value: 999 },
      { field: "paymentExpirationMinutes", value: 999 },
      { field: "refundPolicySummary", value: "HACK" },
      { field: "noShowPolicySummary", value: "HACK" },
      { field: "clientIpHash", value: "hash-falso" },
      { field: "userAgentHash", value: "hash-falso" },
      { field: "acceptedAt", value: new Date().toISOString() },
      { field: "barbeariaId", value: validObjectId },
      { field: "userId", value: validObjectId },
      { field: "checkboxLabelSnapshot", value: "MALICIOSO" },
      { field: "acceptanceTextSnapshot", value: "MALICIOSO" },
      { field: "reservaId", value: validObjectId },
    ];

    for (const { field, value } of serverOwnedFields) {
      it(`deve rejeitar campo server-owned '${field}' em acceptedTerms`, () => {
        const result = criarReservaSchema.safeParse({
          body: validBody({
            acceptedTerms: { ...validAcceptedTerms(), [field]: value },
          }),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
        }
      });
    }
  });

  // =====================================================
  // MASS ASSIGNMENT — campo desconhecido no body raiz
  // =====================================================

  describe("Mass assignment: campo desconhecido no body raiz", () => {
    it("deve rejeitar campo extra mesmo com acceptedTerms válido", () => {
      const result = criarReservaSchema.safeParse({
        body: {
          ...validBody({ acceptedTerms: validAcceptedTerms() }),
          paymentStatus: "aprovado",
        },
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar injeção de status no body", () => {
      const result = criarReservaSchema.safeParse({
        body: {
          ...validBody({ acceptedTerms: validAcceptedTerms() }),
          status: "confirmado",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  // =====================================================
  // AUSÊNCIA DE PIX/PAYMENT_PENDING
  // =====================================================

  describe("Ausência de Pix/payment_pending", () => {
    it("schema não aceita campo payment_pending", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ payment_pending: true }),
      });
      expect(result.success).toBe(false);
    });

    it("schema não aceita campo pixQrCode", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ pixQrCode: "data:image/png;base64,..." }),
      });
      expect(result.success).toBe(false);
    });

    it("schema não aceita campo webhookUrl", () => {
      const result = criarReservaSchema.safeParse({
        body: validBody({ webhookUrl: "https://evil.com/webhook" }),
      });
      expect(result.success).toBe(false);
    });
  });

  // =====================================================
  // acceptedTermsSchema isolado
  // =====================================================

  describe("acceptedTermsSchema (sub-schema isolado)", () => {
    it("deve rejeitar objeto vazio", () => {
      const result = acceptedTermsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("deve aceitar input mínimo válido", () => {
      const result = acceptedTermsSchema.safeParse({
        termsVersionId: validObjectId,
        acceptedTermsCheckbox: true,
        source: "web",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar campo extra arbitrário", () => {
      const result = acceptedTermsSchema.safeParse({
        termsVersionId: validObjectId,
        acceptedTermsCheckbox: true,
        source: "web",
        foo: "bar",
      });
      expect(result.success).toBe(false);
    });
  });
});
