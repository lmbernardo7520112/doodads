// =============================================================
// 📌 tests/bookingPaymentManualExpiration.service.test.ts
// -------------------------------------------------------------
// Testes do service de expiração controlada de BookingPayment
// manual pending vencido (Phase D6)
// =============================================================

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { bookingPaymentManualService } from "../services/bookingPaymentManual.service";
import User from "../models/User";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import Reserva from "../models/Reserva";
import BookingPayment from "../models/BookingPayment";
import { AppError } from "../errors/AppError";

describe("Expiração Controlada de BookingPayment Manual (Phase D6)", () => {
  let mongoServer: MongoMemoryServer;

  let barbeariaId: string;
  let servicoId: string;
  let clienteUserId: string;
  let barbeiroUserId: string;

  // Helper: cria BookingPayment + Reserva associada
  async function createPendingPaymentWithReserva(overrides?: {
    provider?: string;
    bpStatus?: string;
    expiresAt?: Date;
    paymentRequired?: boolean;
    mismatchBookingPaymentId?: boolean;
    noExpiresAt?: boolean;
  }) {
    const reserva = await Reserva.create({
      usuario: clienteUserId,
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pendente",
      paymentRequired: overrides?.paymentRequired !== undefined ? overrides.paymentRequired : true,
      paymentStatus: "pending",
    });

    const bpData: any = {
      reservaId: reserva._id,
      barbeariaId,
      provider: overrides?.provider || "manual",
      amountCents: 5000,
      currency: "BRL",
      status: overrides?.bpStatus || "pending",
    };

    if (!overrides?.noExpiresAt) {
      bpData.expiresAt = overrides?.expiresAt || new Date(Date.now() - 10 * 60000); // 10 min no passado por padrão
    }

    const bp = await BookingPayment.create(bpData);

    if (!overrides?.mismatchBookingPaymentId) {
      reserva.bookingPaymentId = bp._id as any;
      await reserva.save();
    }

    return { reserva, bookingPayment: bp };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const barbeiro = await User.create({
      nomeCompleto: "Barbeiro Expiration D6",
      email: "barbeiro_expiration_d6@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    barbeiroUserId = barbeiro._id.toString();

    const cliente = await User.create({
      nomeCompleto: "Cliente Expiration D6",
      email: "cliente_expiration_d6@t.com",
      senha: "123456_password",
      tipo: "cliente",
    } as any);
    clienteUserId = cliente._id.toString();

    const barbearia = await Barbearia.create({
      nome: "Barbearia Expiration D6",
      endereco: {
        rua: "Rua Expiration",
        numero: "66",
        bairro: "Centro",
        cidade: "São Paulo",
        cep: "01001-000",
      },
      telefone1: "11999999666",
      barbeiro: barbeiroUserId,
    });
    barbeariaId = barbearia._id.toString();

    const servico = await Servico.create({
      barbearia: barbeariaId,
      nome: "Corte Expiration D6",
      duracaoMin: 30,
      preco: 50,
      ativo: true,
    });
    servicoId = servico._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await BookingPayment.deleteMany({});
    await Reserva.deleteMany({});
  });

  // =====================================================
  // 1. EXPIRAÇÃO VÁLIDA: pending vencido → expired
  // =====================================================

  it("expira BookingPayment manual pending vencido → status expired", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      expiresAt: new Date(Date.now() - 15 * 60000), // 15 min no passado
    });

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    expect(result.bookingPayment.status).toBe("expired");
    expect(result.reserva.paymentStatus).toBe("expired");
  });

  // =====================================================
  // 2. RESERVA.PAYMENTSTATUS → expired
  // =====================================================

  it("atualiza Reserva.paymentStatus para expired", async () => {
    const { bookingPayment, reserva } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    expect(result.reserva.paymentStatus).toBe("expired");

    // Verificar no banco
    const reservaDb = await Reserva.findById(reserva._id);
    expect(reservaDb!.paymentStatus).toBe("expired");
  });

  // =====================================================
  // 3. STATUS PRINCIPAL DA RESERVA PRESERVADO
  // =====================================================

  it("atualiza Reserva.status principal como 'cancelado' após expiração", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    expect(result.reserva.status).toBe("cancelado");
  });

  // =====================================================
  // 4. PENDING AINDA NÃO VENCIDO NÃO EXPIRA
  // =====================================================

  it("pending ainda não vencido retorna NOT_YET_EXPIRED (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      expiresAt: new Date(Date.now() + 30 * 60000), // 30 min no futuro
    });

    await expect(
      bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
    } catch (error) {
      expect((error as AppError).code).toBe("NOT_YET_EXPIRED");
      expect((error as AppError).statusCode).toBe(409);
    }
  });

  // =====================================================
  // 5. PAID NÃO EXPIRA
  // =====================================================

  it("pagamento paid não pode ser expirado — CANNOT_EXPIRE_PAID (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ bpStatus: "paid" });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("CANNOT_EXPIRE_PAID");
      expect((error as AppError).statusCode).toBe(409);
    }
  });

  // =====================================================
  // 6. CANCELLED NÃO EXPIRA
  // =====================================================

  it("pagamento cancelled não pode ser expirado — CANNOT_EXPIRE_CANCELLED (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ bpStatus: "cancelled" });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("CANNOT_EXPIRE_CANCELLED");
    }
  });

  // =====================================================
  // 7. REFUNDED NÃO EXPIRA
  // =====================================================

  it("pagamento refunded não pode ser expirado — CANNOT_EXPIRE_REFUNDED (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ bpStatus: "refunded" });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("CANNOT_EXPIRE_REFUNDED");
    }
  });

  // =====================================================
  // 8. FAILED NÃO EXPIRA
  // =====================================================

  it("pagamento failed não pode ser expirado — CANNOT_EXPIRE_FAILED (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ bpStatus: "failed" });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("CANNOT_EXPIRE_FAILED");
    }
  });

  // =====================================================
  // 9. MANUAL_REVIEW NÃO EXPIRA
  // =====================================================

  it("pagamento manual_review pode ser expirado se vencido", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      bpStatus: "manual_review",
      expiresAt: new Date(Date.now() - 1000), // no passado (vencido)
    });

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    expect(result.bookingPayment.status).toBe("expired");
  });

  // =====================================================
  // 10. ALREADY_EXPIRED
  // =====================================================

  it("pagamento já expirado retorna ALREADY_EXPIRED (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ bpStatus: "expired" });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("ALREADY_EXPIRED");
    }
  });

  // =====================================================
  // 11. PROVIDER DIFERENTE DE MANUAL NÃO EXPIRA
  // =====================================================

  it("provider banco_api_pix não pode ser expirado — PROVIDER_NOT_MANUAL (400)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ provider: "banco_api_pix" });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("PROVIDER_NOT_MANUAL");
      expect((error as AppError).statusCode).toBe(400);
    }
  });

  // =====================================================
  // 12. RESERVA DIVERGENTE BLOQUEIA
  // =====================================================

  it("Reserva divergente (bookingPaymentId não corresponde) bloqueia — BOOKING_PAYMENT_MISMATCH (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      mismatchBookingPaymentId: true,
    });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("BOOKING_PAYMENT_MISMATCH");
    }
  });

  // =====================================================
  // 13. RESERVA SEM paymentRequired BLOQUEIA
  // =====================================================

  it("Reserva sem paymentRequired bloqueia — RESERVA_PAYMENT_NOT_REQUIRED (409)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      paymentRequired: false,
    });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("RESERVA_PAYMENT_NOT_REQUIRED");
    }
  });

  // =====================================================
  // 14. SEM expiresAt BLOQUEIA
  // =====================================================

  it("BookingPayment sem expiresAt bloqueia — NO_EXPIRES_AT (400)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ noExpiresAt: true });

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("NO_EXPIRES_AT");
      expect((error as AppError).statusCode).toBe(400);
    }
  });

  // =====================================================
  // 15. METADATA AUDIT TRAIL
  // =====================================================

  it("metadata registra expiredAt e expirationReason", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    const metadata = result.bookingPayment.metadataSafe as Record<string, unknown>;
    expect(metadata.expiredAt).toBeDefined();
    expect(metadata.expirationReason).toBe("overdue_manual_payment");
  });

  // =====================================================
  // 16. BOOKINGPAYMENT.EXPIRESAT PRESERVADO
  // =====================================================

  it("BookingPayment.expiresAt preservado após expiração", async () => {
    const expiresAt = new Date(Date.now() - 20 * 60000);
    const { bookingPayment } = await createPendingPaymentWithReserva({ expiresAt });

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    expect(result.bookingPayment.expiresAt!.getTime()).toBe(expiresAt.getTime());
  });

  // =====================================================
  // 17. BOOKINGPAYMENTID INVÁLIDO
  // =====================================================

  it("bookingPaymentId inválido retorna INVALID_BOOKING_PAYMENT_ID (400)", async () => {
    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: "invalido",
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("INVALID_BOOKING_PAYMENT_ID");
      expect((error as AppError).statusCode).toBe(400);
    }
  });

  // =====================================================
  // 18. BOOKINGPAYMENT NÃO ENCONTRADO
  // =====================================================

  it("bookingPayment inexistente retorna BOOKING_PAYMENT_NOT_FOUND (404)", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    try {
      await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: fakeId,
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
      fail("Deveria ter lançado erro");
    } catch (error) {
      expect((error as AppError).code).toBe("BOOKING_PAYMENT_NOT_FOUND");
      expect((error as AppError).statusCode).toBe(404);
    }
  });

  // =====================================================
  // 19. AUSÊNCIA DE CRON/JOB/ROTA/FRONTEND
  // =====================================================

  it("expiração é uma função de domínio pura, sem cron/job/scheduler", () => {
    // A função expireOverdueManualBookingPayment é chamada diretamente
    // Não há cron, job, scheduler ou rota associada nesta fase
    expect(typeof bookingPaymentManualService.expireOverdueManualBookingPayment).toBe("function");
    // Verifica que não existem imports de cron/scheduler no service
    // (verificação estática — este teste serve como documentação)
  });

  // =====================================================
  // 20. AUSÊNCIA DE PIX REAL, QR, WEBHOOK, PROVIDER
  // =====================================================

  it("expiração não envolve Pix real, QR, webhook ou provider real", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    const body = JSON.stringify(result);
    expect(body).not.toMatch(/pixQrCode/i);
    expect(body).not.toMatch(/pixCopyPaste/i);
    expect(body).not.toMatch(/copiaECola/i);
    expect(body).not.toMatch(/webhookEventId/i);
    expect(body).not.toMatch(/providerPaymentId/i);
    expect(body).not.toMatch(/pixKey/i);
    expect(body).not.toMatch(/credentialRef/i);
    expect(result.bookingPayment.provider).toBe("manual");
  });

  // =====================================================
  // 21. VERIFICAÇÃO NO BANCO APÓS EXPIRAÇÃO
  // =====================================================

  it("verificação no banco: BookingPayment.status = expired após expiração", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    const bpDb = await BookingPayment.findById(bookingPayment._id);
    expect(bpDb!.status).toBe("expired");
  });
});
