import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Reserva from "../models/Reserva";

/**
 * Testes de model/schema para campos de pagamento em Reserva — Phase D1.
 * Validam retrocompatibilidade, defaults, campos opcionais e rejeição de valores inválidos.
 */
describe("Reserva Model — Payment Fields (Phase D1)", () => {
  let mongoServer: MongoMemoryServer;

  const baseReserva = () => ({
    usuario: new mongoose.Types.ObjectId(),
    barbearia: new mongoose.Types.ObjectId(),
    servico: new mongoose.Types.ObjectId(),
    dataHora: new Date(Date.now() + 86400000),
    valor: 50,
  });

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Reserva.deleteMany({});
  });

  // =====================================================
  // RETROCOMPATIBILIDADE — reserva antiga sem campos novos
  // =====================================================

  describe("Retrocompatibilidade: reserva sem campos de pagamento", () => {
    it("deve criar reserva antiga sem campos de pagamento e funcionar normalmente", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva).toBeDefined();
      expect(reserva.status).toBe("pendente");
      expect(reserva.paymentStatus).toBe("pendente"); // default legado
    });

    it("deve manter status padrão 'pendente' intacto", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.status).toBe("pendente");
    });

    it("deve manter paymentStatus legado 'aprovado' válido", async () => {
      const reserva = await Reserva.create({
        ...baseReserva(),
        paymentStatus: "aprovado",
      });
      expect(reserva.paymentStatus).toBe("aprovado");
    });

    it("deve manter paymentStatus legado 'falhou' válido", async () => {
      const reserva = await Reserva.create({
        ...baseReserva(),
        paymentStatus: "falhou",
      });
      expect(reserva.paymentStatus).toBe("falhou");
    });
  });

  // =====================================================
  // DEFAULTS DOS CAMPOS NOVOS
  // =====================================================

  describe("Defaults dos campos de pagamento D1", () => {
    it("default paymentRequired deve ser false", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.paymentRequired).toBe(false);
    });

    it("bookingPaymentId deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.bookingPaymentId).toBeUndefined();
    });

    it("termsAcceptanceId deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.termsAcceptanceId).toBeUndefined();
    });

    it("paymentExpiresAt deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.paymentExpiresAt).toBeUndefined();
    });

    it("confirmedAt deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.confirmedAt).toBeUndefined();
    });

    it("noShowMarkedAt deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.noShowMarkedAt).toBeUndefined();
    });

    it("noShowMarkedBy deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.noShowMarkedBy).toBeUndefined();
    });

    it("cancelledAt deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.cancelledAt).toBeUndefined();
    });

    it("completedAt deve ser undefined por padrão", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.completedAt).toBeUndefined();
    });
  });

  // =====================================================
  // NOVOS VALORES DE PAYMENTSTATUS
  // =====================================================

  describe("Novos valores de paymentStatus (D1)", () => {
    const newStatuses = [
      "not_required", "pending", "paid", "expired",
      "refunded", "failed", "manual_review",
    ];

    for (const status of newStatuses) {
      it(`deve aceitar paymentStatus '${status}'`, async () => {
        const reserva = await Reserva.create({
          ...baseReserva(),
          paymentStatus: status,
        });
        expect(reserva.paymentStatus).toBe(status);
      });
    }
  });

  // =====================================================
  // REJEIÇÃO DE VALORES INVÁLIDOS
  // =====================================================

  describe("Rejeição de valores inválidos", () => {
    it("deve rejeitar paymentStatus inválido", async () => {
      await expect(
        Reserva.create({
          ...baseReserva(),
          paymentStatus: "status_invalido",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar status principal inválido (enum inalterado)", async () => {
      await expect(
        Reserva.create({
          ...baseReserva(),
          status: "payment_pending",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar status 'expired' no enum principal (não adicionado)", async () => {
      await expect(
        Reserva.create({
          ...baseReserva(),
          status: "expired",
        })
      ).rejects.toThrow();
    });
  });

  // =====================================================
  // CAMPOS OPCIONAIS — ObjectId refs
  // =====================================================

  describe("Campos opcionais ObjectId refs", () => {
    it("deve aceitar bookingPaymentId válido", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const reserva = await Reserva.create({
        ...baseReserva(),
        bookingPaymentId: fakeId,
      });
      expect(reserva.bookingPaymentId!.toString()).toBe(fakeId.toString());
    });

    it("deve aceitar termsAcceptanceId válido", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const reserva = await Reserva.create({
        ...baseReserva(),
        termsAcceptanceId: fakeId,
      });
      expect(reserva.termsAcceptanceId!.toString()).toBe(fakeId.toString());
    });

    it("deve aceitar noShowMarkedBy válido (ref User)", async () => {
      const userId = new mongoose.Types.ObjectId();
      const reserva = await Reserva.create({
        ...baseReserva(),
        noShowMarkedBy: userId,
        noShowMarkedAt: new Date(),
      });
      expect(reserva.noShowMarkedBy!.toString()).toBe(userId.toString());
      expect(reserva.noShowMarkedAt).toBeDefined();
    });
  });

  // =====================================================
  // CAMPOS OPCIONAIS — Dates
  // =====================================================

  describe("Campos opcionais Date", () => {
    it("deve aceitar paymentExpiresAt", async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const reserva = await Reserva.create({
        ...baseReserva(),
        paymentExpiresAt: expires,
      });
      expect(reserva.paymentExpiresAt!.getTime()).toBe(expires.getTime());
    });

    it("deve aceitar confirmedAt", async () => {
      const now = new Date();
      const reserva = await Reserva.create({
        ...baseReserva(),
        confirmedAt: now,
        status: "confirmado",
      });
      expect(reserva.confirmedAt!.getTime()).toBe(now.getTime());
    });

    it("deve aceitar cancelledAt", async () => {
      const now = new Date();
      const reserva = await Reserva.create({
        ...baseReserva(),
        cancelledAt: now,
        status: "cancelado",
      });
      expect(reserva.cancelledAt!.getTime()).toBe(now.getTime());
    });

    it("deve aceitar completedAt", async () => {
      const now = new Date();
      const reserva = await Reserva.create({
        ...baseReserva(),
        completedAt: now,
        status: "finalizado",
      });
      expect(reserva.completedAt!.getTime()).toBe(now.getTime());
    });
  });

  // =====================================================
  // PAYMENTREQUIRED
  // =====================================================

  describe("paymentRequired", () => {
    it("deve aceitar paymentRequired true", async () => {
      const reserva = await Reserva.create({
        ...baseReserva(),
        paymentRequired: true,
      });
      expect(reserva.paymentRequired).toBe(true);
    });

    it("deve aceitar paymentRequired false explícito", async () => {
      const reserva = await Reserva.create({
        ...baseReserva(),
        paymentRequired: false,
      });
      expect(reserva.paymentRequired).toBe(false);
    });
  });

  // =====================================================
  // AUSÊNCIA DE ATIVAÇÃO FUNCIONAL
  // =====================================================

  describe("Ausência de ativação funcional", () => {
    it("enum de status principal NÃO contém payment_pending", async () => {
      // Confirmar que o enum do schema não foi alterado
      const statusPath = Reserva.schema.path("status") as any;
      const enumValues = statusPath.enumValues;
      expect(enumValues).toEqual(["pendente", "confirmado", "cancelado", "finalizado"]);
      expect(enumValues).not.toContain("payment_pending");
      expect(enumValues).not.toContain("expired");
      expect(enumValues).not.toContain("no_show");
      expect(enumValues).not.toContain("manual_review");
    });

    it("paymentStatus enum contém valores legados e novos sem ativar fluxo", async () => {
      const paymentStatusPath = Reserva.schema.path("paymentStatus") as any;
      const enumValues = paymentStatusPath.enumValues;
      // Legados
      expect(enumValues).toContain("pendente");
      expect(enumValues).toContain("aprovado");
      expect(enumValues).toContain("falhou");
      // Novos
      expect(enumValues).toContain("not_required");
      expect(enumValues).toContain("pending");
      expect(enumValues).toContain("paid");
      expect(enumValues).toContain("expired");
      expect(enumValues).toContain("refunded");
      expect(enumValues).toContain("failed");
      expect(enumValues).toContain("manual_review");
    });

    it("reserva criada sem campos novos mantém fluxo antigo intacto", async () => {
      const reserva = await Reserva.create(baseReserva());
      expect(reserva.status).toBe("pendente");
      expect(reserva.paymentStatus).toBe("pendente");
      expect(reserva.paymentRequired).toBe(false);
      expect(reserva.bookingPaymentId).toBeUndefined();
      expect(reserva.termsAcceptanceId).toBeUndefined();
      expect(reserva.paymentExpiresAt).toBeUndefined();
    });
  });
});
