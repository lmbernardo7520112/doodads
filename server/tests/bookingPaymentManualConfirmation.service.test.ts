import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import BookingPayment from "../models/BookingPayment";
import {
  bookingPaymentManualService,
  ConfirmManualBookingPaymentInput,
} from "../services/bookingPaymentManual.service";
import { AppError } from "../errors/AppError";

describe("BookingPaymentManual — Confirmação Manual (Phase D4)", () => {
  let mongoServer: MongoMemoryServer;

  // IDs de referência
  let barbeariaId: string;
  let servicoId: string;
  let barbeiroUserId: string;
  let clienteUserId: string;
  let adminUserId: string;
  let outroBarbeiroUserId: string;
  let outraBarbeariaId: string;

  // Helper: cria um BookingPayment manual pending com Reserva associada
  async function createPendingPaymentWithReserva(overrides?: {
    provider?: string;
    status?: string;
    expiresAt?: Date;
    barbeariaIdOverride?: string;
  }) {
    const bId = overrides?.barbeariaIdOverride || barbeariaId;
    const expiresAt = overrides?.expiresAt || new Date(Date.now() + 30 * 60000); // 30 min futuro

    const reserva = await Reserva.create({
      usuario: clienteUserId,
      barbearia: bId,
      servico: servicoId,
      dataHora: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h futuro
      status: "pendente",
      paymentRequired: true,
      paymentStatus: "pending",
    });

    const bp = await BookingPayment.create({
      reservaId: reserva._id,
      barbeariaId: bId,
      provider: overrides?.provider || "manual",
      amountCents: 6550,
      currency: "BRL",
      status: overrides?.status || "pending",
      expiresAt,
    });

    // Vincular bookingPaymentId na reserva
    reserva.bookingPaymentId = bp._id as any;
    await reserva.save();

    return { reserva, bookingPayment: bp };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Criar usuário barbeiro (dono da barbearia)
    const barbeiro = await User.create({
      nomeCompleto: "Barbeiro Dono D4",
      email: "barbeiro_d4@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    barbeiroUserId = barbeiro._id.toString();

    // Criar usuário cliente
    const cliente = await User.create({
      nomeCompleto: "Cliente Test D4",
      email: "cliente_d4@t.com",
      senha: "123456_password",
      tipo: "cliente",
    } as any);
    clienteUserId = cliente._id.toString();

    // Criar usuário admin
    const admin = await User.create({
      nomeCompleto: "Admin Test D4",
      email: "admin_d4@t.com",
      senha: "123456_password",
      tipo: "admin",
    } as any);
    adminUserId = admin._id.toString();

    // Criar outro barbeiro (de outra barbearia)
    const outroBarbeiro = await User.create({
      nomeCompleto: "Outro Barbeiro D4",
      email: "outro_barbeiro_d4@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    outroBarbeiroUserId = outroBarbeiro._id.toString();

    // Criar barbearia principal (com barbeiro vinculado)
    const barbearia = await Barbearia.create({
      nome: "Barbearia Confirmação D4",
      endereco: {
        rua: "Rua A",
        numero: "10",
        bairro: "Centro",
        cidade: "São Paulo",
        cep: "01001-000",
      },
      telefone1: "11999999999",
      barbeiro: barbeiroUserId,
    });
    barbeariaId = barbearia._id.toString();

    // Criar outra barbearia (com outro barbeiro)
    const outraBarbearia = await Barbearia.create({
      nome: "Outra Barbearia D4",
      endereco: {
        rua: "Rua B",
        numero: "20",
        bairro: "Vila",
        cidade: "São Paulo",
        cep: "01002-000",
      },
      telefone1: "11888888888",
      barbeiro: outroBarbeiroUserId,
    });
    outraBarbeariaId = outraBarbearia._id.toString();

    // Criar serviço (preço: R$ 65.50 -> 6550 centavos)
    const servico = await Servico.create({
      barbearia: barbeariaId,
      nome: "Corte Completo D4",
      duracaoMin: 40,
      preco: 65.5,
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
  // 1. CONFIRMAÇÃO VÁLIDA: pending → paid
  // =====================================================

  it("deve confirmar pagamento manual pending → paid com barbeiro autorizado", async () => {
    const { reserva, bookingPayment } = await createPendingPaymentWithReserva();

    const input: ConfirmManualBookingPaymentInput = {
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    };

    const result = await bookingPaymentManualService.confirmManualBookingPayment(input);

    expect(result.bookingPayment.status).toBe("paid");
    expect(result.bookingPayment.paidAt).toBeDefined();
    expect(result.bookingPayment.paidAt).toBeInstanceOf(Date);
    expect(result.reserva.paymentStatus).toBe("paid");
    expect(result.reserva.confirmedAt).toBeDefined();
    expect(result.reserva.confirmedAt).toBeInstanceOf(Date);
  });

  // =====================================================
  // 2. RESERVA.PAYMENTSTATUS ATUALIZADO PARA paid
  // =====================================================

  it("deve atualizar Reserva.paymentStatus para 'paid' no banco após confirmação", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    const reservaDb = await Reserva.findOne({ bookingPaymentId: bookingPayment._id });
    expect(reservaDb!.paymentStatus).toBe("paid");
  });

  // =====================================================
  // 3. PAIDAT DEFINIDO
  // =====================================================

  it("deve definir paidAt no BookingPayment após confirmação", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    const bpDb = await BookingPayment.findById(bookingPayment._id);
    expect(bpDb!.paidAt).toBeDefined();
    expect(bpDb!.status).toBe("paid");
  });

  // =====================================================
  // 4. CLIENTE NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação por cliente (403)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: clienteUserId,
        userTipo: "cliente",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: clienteUserId,
        userTipo: "cliente",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(403);
      expect((err as AppError).code).toBe("CLIENT_CANNOT_CONFIRM_PAYMENT");
    }
  });

  // =====================================================
  // 5. BARBEIRO DE OUTRA BARBEARIA NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação por barbeiro de outra barbearia (403 OWNERSHIP_MISMATCH)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: outroBarbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: outroBarbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(403);
      expect((err as AppError).code).toBe("OWNERSHIP_MISMATCH");
    }
  });

  // =====================================================
  // 6. PAGAMENTO JÁ PAID NÃO CONFIRMA DE NOVO
  // =====================================================

  it("deve rejeitar confirmação de pagamento já paid (409 ALREADY_PAID)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "paid" });

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).code).toBe("ALREADY_PAID");
    }
  });

  // =====================================================
  // 7. PAGAMENTO EXPIRED NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação de pagamento expired (409 PAYMENT_EXPIRED)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "expired" });

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).code).toBe("PAYMENT_EXPIRED");
    }
  });

  // =====================================================
  // 8. PAGAMENTO CANCELLED NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação de pagamento cancelled (409 PAYMENT_CANCELLED)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "cancelled" });

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).code).toBe("PAYMENT_CANCELLED");
    }
  });

  // =====================================================
  // 9. PAGAMENTO REFUNDED NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação de pagamento refunded (409 PAYMENT_REFUNDED)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "refunded" });

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).code).toBe("PAYMENT_REFUNDED");
    }
  });

  // =====================================================
  // 10. PAGAMENTO FAILED NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação de pagamento failed (409 PAYMENT_FAILED)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "failed" });

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).code).toBe("PAYMENT_FAILED");
    }
  });

  // =====================================================
  // 11. PAGAMENTO MANUAL_REVIEW NÃO CONFIRMA
  // =====================================================

  it("deve permitir confirmação de pagamento manual_review", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "manual_review" });

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    expect(result.bookingPayment.status).toBe("paid");
  });

  // =====================================================
  // 12. PROVIDER DIFERENTE DE MANUAL NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação de pagamento com provider != manual (400 PROVIDER_NOT_MANUAL)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ provider: "banco_api_pix" });

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).code).toBe("PROVIDER_NOT_MANUAL");
    }
  });

  // =====================================================
  // 13. PAGAMENTO TARDIO NÃO CONFIRMA AUTOMATICAMENTE
  // =====================================================

  it("deve encaminhar para manual_review em caso de pagamento tardio (expiresAt ultrapassado)", async () => {
    // Criar com expiresAt no passado
    const { bookingPayment } = await createPendingPaymentWithReserva({
      expiresAt: new Date(Date.now() - 5 * 60000), // 5 min no passado
    });

    let caughtError: AppError | undefined;
    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      caughtError = err as AppError;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError!.statusCode).toBe(409);
    expect(caughtError!.code).toBe("PAYMENT_EXPIRED_LATE_CONFIRMATION");

    // Verificar que o BookingPayment foi para manual_review (não paid)
    const bpDb = await BookingPayment.findById(bookingPayment._id);
    expect(bpDb!.status).toBe("manual_review");
    expect(bpDb!.paidAt).toBeUndefined();
  });

  // =====================================================
  // 14. ADMIN PODE CONFIRMAR QUALQUER BARBEARIA
  // =====================================================

  it("deve permitir que admin confirme pagamento de qualquer barbearia", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: adminUserId,
      userTipo: "admin",
    });

    expect(result.bookingPayment.status).toBe("paid");
    expect(result.bookingPayment.paidAt).toBeDefined();
    expect(result.reserva.paymentStatus).toBe("paid");
  });

  // =====================================================
  // 15. RESERVA SEM PAYMENT REQUIRED NÃO CONFIRMA
  // =====================================================

  it("deve rejeitar confirmação quando Reserva.paymentRequired é false", async () => {
    // Criar reserva sem paymentRequired
    const reserva = await Reserva.create({
      usuario: clienteUserId,
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pendente",
      paymentRequired: false,
      paymentStatus: "pendente",
    });

    const bp = await BookingPayment.create({
      reservaId: reserva._id,
      barbeariaId,
      provider: "manual",
      amountCents: 6550,
      currency: "BRL",
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60000),
    });

    reserva.bookingPaymentId = bp._id as any;
    await reserva.save();

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bp._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bp._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).code).toBe("RESERVA_PAYMENT_NOT_REQUIRED");
    }
  });

  // =====================================================
  // 16. BOOKING PAYMENT ID INVÁLIDO
  // =====================================================

  it("deve rejeitar bookingPaymentId inválido (400)", async () => {
    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: "invalido",
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: "invalido",
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).code).toBe("INVALID_BOOKING_PAYMENT_ID");
    }
  });

  // =====================================================
  // 17. BOOKING PAYMENT NÃO ENCONTRADO
  // =====================================================

  it("deve rejeitar bookingPaymentId inexistente (404)", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: fakeId,
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: fakeId,
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).statusCode).toBe(404);
      expect((err as AppError).code).toBe("BOOKING_PAYMENT_NOT_FOUND");
    }
  });

  // =====================================================
  // 18. RESERVA STATUS PRINCIPAL MANTIDO (retrocompatibilidade)
  // =====================================================

  it("deve alterar Reserva.status para 'confirmado' após confirmação", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    // paymentStatus deve ser paid, e status principal atualizado
    expect(result.reserva.paymentStatus).toBe("paid");
    expect(result.reserva.status).toBe("confirmado");
  });

  // =====================================================
  // 19. CONFIRMATION NOTE PERSISTIDA
  // =====================================================

  it("deve persistir confirmationNote no metadataSafe do BookingPayment", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
      confirmationNote: "Pix recebido às 14h",
    });

    const meta = result.bookingPayment.metadataSafe as Record<string, unknown>;
    expect(meta.confirmationNote).toBe("Pix recebido às 14h");
    expect(meta.confirmedBy).toBe(barbeiroUserId);
    expect(meta.confirmedByTipo).toBe("barbeiro");
  });

  // =====================================================
  // 20. BOOKING PAYMENT MISMATCH
  // =====================================================

  it("deve rejeitar confirmação quando bookingPaymentId não corresponde ao da Reserva", async () => {
    // Criar dois pagamentos separados
    const { reserva } = await createPendingPaymentWithReserva();
    const bp2 = await BookingPayment.create({
      reservaId: reserva._id,
      barbeariaId,
      provider: "manual",
      amountCents: 6550,
      currency: "BRL",
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60000),
    });

    // Tentar confirmar o segundo BP — a reserva aponta para o primeiro
    await expect(
      bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bp2._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      })
    ).rejects.toThrow(AppError);

    try {
      await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bp2._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });
    } catch (err) {
      expect((err as AppError).code).toBe("BOOKING_PAYMENT_MISMATCH");
    }
  });

  // =====================================================
  // 21. AUSÊNCIA DE PIX REAL, QR, WEBHOOK, PROVIDER REAL
  // =====================================================

  it("não deve existir referências a QR code real, webhook ou provider real no resultado", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId: bookingPayment._id.toString(),
      userId: barbeiroUserId,
      userTipo: "barbeiro",
    });

    const bp = result.bookingPayment;
    expect(bp.pixQrCodeRef).toBeUndefined();
    expect(bp.pixCopyPasteRef).toBeUndefined();
    expect(bp.webhookEventId).toBeUndefined();
    expect(bp.providerPaymentId).toBeUndefined();
    expect(bp.providerPaymentReference).toBeUndefined();
    expect(bp.provider).toBe("manual");
  });

  // =====================================================
  // 22. NENHUMA ROTA NOVA (auditoria estática)
  // =====================================================

  it("não deve expor nenhum método HTTP/rota pública na confirmação (service-only)", () => {
    // Este teste verifica que o service não depende de req/res/next
    // A confirmação é puramente a nível de service/repository
    const service = bookingPaymentManualService;
    expect(typeof service.confirmManualBookingPayment).toBe("function");

    // Não deve ter nenhum método que receba req/res
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    const httpMethods = methods.filter((m) =>
      /\b(get|post|put|patch|delete|route|middleware|handler)\b/i.test(m)
    );
    expect(httpMethods).toHaveLength(0);
  });

  // =====================================================
  // 23. NENHUM FRONTEND
  // =====================================================

  // =====================================================
  // 👥 Relação ao Cliente Declarar Pago (Já enviei o Pix)
  // =====================================================

  describe("Cliente declarar pagamento enviado (Já enviei o Pix)", () => {
    it("deve transicionar status para manual_review quando cliente declara pago", async () => {
      const { bookingPayment, reserva } = await createPendingPaymentWithReserva();

      const result = await bookingPaymentManualService.reportManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: clienteUserId,
      });

      expect(result.bookingPayment.status).toBe("manual_review");
      expect(result.reserva.paymentStatus).toBe("manual_review");
      expect(result.bookingPayment.metadataSafe).toHaveProperty("reportedAt");
    });

    it("deve rejeitar se o usuário não for o dono da reserva", async () => {
      const { bookingPayment } = await createPendingPaymentWithReserva();

      await expect(
        bookingPaymentManualService.reportManualBookingPayment({
          bookingPaymentId: bookingPayment._id.toString(),
          userId: outroBarbeiroUserId, // não é dono
        })
      ).rejects.toMatchObject({ code: "OWNERSHIP_MISMATCH" });
    });

    it("deve rejeitar se o pagamento não estiver pending", async () => {
      const { bookingPayment } = await createPendingPaymentWithReserva({
        status: "paid",
      });

      await expect(
        bookingPaymentManualService.reportManualBookingPayment({
          bookingPaymentId: bookingPayment._id.toString(),
          userId: clienteUserId,
        })
      ).rejects.toMatchObject({ code: "NOT_PENDING" });
    });
  });

  describe("Confirmação e Expiração de pagamentos em manual_review", () => {
    it("deve permitir ao barbeiro confirmar pagamento que está em manual_review", async () => {
      const { bookingPayment } = await createPendingPaymentWithReserva({
        status: "manual_review",
      });

      const result = await bookingPaymentManualService.confirmManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });

      expect(result.bookingPayment.status).toBe("paid");
      expect(result.reserva.paymentStatus).toBe("paid");
    });

    it("deve permitir ao barbeiro expirar pagamento vencido que está em manual_review", async () => {
      const { bookingPayment } = await createPendingPaymentWithReserva({
        status: "manual_review",
        expiresAt: new Date(Date.now() - 1000), // no passado
      });

      const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
        bookingPaymentId: bookingPayment._id.toString(),
        userId: barbeiroUserId,
        userTipo: "barbeiro",
      });

      expect(result.bookingPayment.status).toBe("expired");
      expect(result.reserva.paymentStatus).toBe("expired");
    });
  });
});
