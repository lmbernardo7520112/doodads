import {
  presentPaymentStatus,
  presentReservaStatus,
  allPaymentStatuses,
  allReservaStatuses,
  StatusPresentation,
} from "../presenters/statusPresenter";

/**
 * Testes do presenter/mapper PT-BR para status internos — Phase D1.5.
 * Garantem que nenhum enum técnico é exibido cru ao usuário,
 * que todos os valores conhecidos têm label PT-BR e que
 * status desconhecidos retornam fallback seguro.
 */
describe("statusPresenter — Labels PT-BR (Phase D1.5)", () => {
  // =====================================================
  // PAYMENTSTATUS — 10 valores
  // =====================================================

  describe("presentPaymentStatus — valores legados (PT)", () => {
    it("deve traduzir 'pendente'", () => {
      const result = presentPaymentStatus("pendente");
      expect(result.code).toBe("pendente");
      expect(result.label).toBe("Pagamento pendente");
      expect(result.tone).toBe("warning");
    });

    it("deve traduzir 'aprovado'", () => {
      const result = presentPaymentStatus("aprovado");
      expect(result.code).toBe("aprovado");
      expect(result.label).toBe("Pagamento aprovado");
      expect(result.tone).toBe("success");
    });

    it("deve traduzir 'falhou'", () => {
      const result = presentPaymentStatus("falhou");
      expect(result.code).toBe("falhou");
      expect(result.label).toBe("Pagamento falhou");
      expect(result.tone).toBe("danger");
    });
  });

  describe("presentPaymentStatus — valores novos (EN → PT-BR)", () => {
    it("deve traduzir 'not_required'", () => {
      const result = presentPaymentStatus("not_required");
      expect(result.code).toBe("not_required");
      expect(result.label).toBe("Pagamento não exigido");
      expect(result.tone).toBe("neutral");
    });

    it("deve traduzir 'pending'", () => {
      const result = presentPaymentStatus("pending");
      expect(result.code).toBe("pending");
      expect(result.label).toBe("Pagamento pendente");
      expect(result.tone).toBe("warning");
    });

    it("deve traduzir 'paid'", () => {
      const result = presentPaymentStatus("paid");
      expect(result.code).toBe("paid");
      expect(result.label).toBe("Pagamento confirmado");
      expect(result.tone).toBe("success");
    });

    it("deve traduzir 'expired'", () => {
      const result = presentPaymentStatus("expired");
      expect(result.code).toBe("expired");
      expect(result.label).toBe("Pagamento expirado");
      expect(result.tone).toBe("danger");
    });

    it("deve traduzir 'refunded'", () => {
      const result = presentPaymentStatus("refunded");
      expect(result.code).toBe("refunded");
      expect(result.label).toBe("Reembolsado");
      expect(result.tone).toBe("info");
    });

    it("deve traduzir 'failed'", () => {
      const result = presentPaymentStatus("failed");
      expect(result.code).toBe("failed");
      expect(result.label).toBe("Pagamento falhou");
      expect(result.tone).toBe("danger");
    });

    it("deve traduzir 'manual_review'", () => {
      const result = presentPaymentStatus("manual_review");
      expect(result.code).toBe("manual_review");
      expect(result.label).toBe("Em análise manual");
      expect(result.tone).toBe("warning");
    });
  });

  // =====================================================
  // RESERVA STATUS — 4 valores
  // =====================================================

  describe("presentReservaStatus — 4 valores", () => {
    it("deve traduzir 'pendente'", () => {
      const result = presentReservaStatus("pendente");
      expect(result.code).toBe("pendente");
      expect(result.label).toBe("Pendente");
      expect(result.tone).toBe("warning");
    });

    it("deve traduzir 'confirmado'", () => {
      const result = presentReservaStatus("confirmado");
      expect(result.code).toBe("confirmado");
      expect(result.label).toBe("Confirmada");
      expect(result.tone).toBe("success");
    });

    it("deve traduzir 'cancelado'", () => {
      const result = presentReservaStatus("cancelado");
      expect(result.code).toBe("cancelado");
      expect(result.label).toBe("Cancelada");
      expect(result.tone).toBe("danger");
    });

    it("deve traduzir 'finalizado'", () => {
      const result = presentReservaStatus("finalizado");
      expect(result.code).toBe("finalizado");
      expect(result.label).toBe("Finalizada");
      expect(result.tone).toBe("success");
    });
  });

  // =====================================================
  // FALLBACK — status desconhecido
  // =====================================================

  describe("Fallback para status desconhecido", () => {
    it("paymentStatus desconhecido retorna fallback seguro", () => {
      const result = presentPaymentStatus("valor_inventado");
      expect(result.code).toBe("valor_inventado");
      expect(result.label).toBe("Status desconhecido");
      expect(result.description).toContain("valor_inventado");
      expect(result.description).toContain("paymentStatus");
      expect(result.tone).toBe("neutral");
    });

    it("reservaStatus desconhecido retorna fallback seguro", () => {
      const result = presentReservaStatus("status_inexistente");
      expect(result.code).toBe("status_inexistente");
      expect(result.label).toBe("Status desconhecido");
      expect(result.description).toContain("status_inexistente");
      expect(result.description).toContain("reservaStatus");
      expect(result.tone).toBe("neutral");
    });

    it("string vazia retorna fallback seguro", () => {
      const result = presentPaymentStatus("");
      expect(result.label).toBe("Status desconhecido");
      expect(result.tone).toBe("neutral");
    });
  });

  // =====================================================
  // GARANTIAS DE NÃO EXPOSIÇÃO DE ENUM CRU
  // =====================================================

  describe("Garantia de não exposição de enum técnico cru", () => {
    const englishCodes = ["not_required", "pending", "paid", "expired", "refunded", "failed", "manual_review"];

    for (const code of englishCodes) {
      it(`label de '${code}' NÃO é o próprio código em inglês`, () => {
        const result = presentPaymentStatus(code);
        expect(result.label).not.toBe(code);
        expect(result.label.length).toBeGreaterThan(0);
      });
    }

    it("nenhum label de paymentStatus contém underscore (indicador de enum cru)", () => {
      const all = allPaymentStatuses();
      for (const status of all) {
        expect(status.label).not.toContain("_");
      }
    });

    it("nenhum label de reservaStatus contém underscore", () => {
      const all = allReservaStatuses();
      for (const status of all) {
        expect(status.label).not.toContain("_");
      }
    });
  });

  // =====================================================
  // COBERTURA COMPLETA
  // =====================================================

  describe("Cobertura completa de status conhecidos", () => {
    it("allPaymentStatuses retorna exatamente 10 status", () => {
      const all = allPaymentStatuses();
      expect(all).toHaveLength(10);
    });

    it("allReservaStatuses retorna exatamente 4 status", () => {
      const all = allReservaStatuses();
      expect(all).toHaveLength(4);
    });

    it("cada paymentStatus tem code, label, description e tone", () => {
      const all = allPaymentStatuses();
      for (const status of all) {
        expect(status.code).toBeDefined();
        expect(status.label).toBeDefined();
        expect(status.description).toBeDefined();
        expect(status.tone).toBeDefined();
        expect(status.code.length).toBeGreaterThan(0);
        expect(status.label.length).toBeGreaterThan(0);
        expect(status.description.length).toBeGreaterThan(0);
      }
    });

    it("cada reservaStatus tem code, label, description e tone", () => {
      const all = allReservaStatuses();
      for (const status of all) {
        expect(status.code).toBeDefined();
        expect(status.label).toBeDefined();
        expect(status.description).toBeDefined();
        expect(status.tone).toBeDefined();
        expect(status.code.length).toBeGreaterThan(0);
        expect(status.label.length).toBeGreaterThan(0);
        expect(status.description.length).toBeGreaterThan(0);
      }
    });

    it("tones são valores válidos", () => {
      const validTones = ["neutral", "info", "success", "warning", "danger"];
      const all = [...allPaymentStatuses(), ...allReservaStatuses()];
      for (const status of all) {
        expect(validTones).toContain(status.tone);
      }
    });
  });

  // =====================================================
  // RETROCOMPATIBILIDADE LEGADA
  // =====================================================

  describe("Retrocompatibilidade com valores legados em português", () => {
    it("'pendente' legado produz label contextualizado para pagamento", () => {
      const result = presentPaymentStatus("pendente");
      expect(result.label).toBe("Pagamento pendente");
    });

    it("'aprovado' legado produz label contextualizado", () => {
      const result = presentPaymentStatus("aprovado");
      expect(result.label).toBe("Pagamento aprovado");
    });

    it("'falhou' legado produz label contextualizado", () => {
      const result = presentPaymentStatus("falhou");
      expect(result.label).toBe("Pagamento falhou");
    });

    it("'pendente' como reservaStatus produz label diferente do paymentStatus", () => {
      const paymentResult = presentPaymentStatus("pendente");
      const reservaResult = presentReservaStatus("pendente");
      expect(paymentResult.label).not.toBe(reservaResult.label);
      expect(paymentResult.label).toBe("Pagamento pendente");
      expect(reservaResult.label).toBe("Pendente");
    });
  });
});
