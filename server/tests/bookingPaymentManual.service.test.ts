import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { bookingPaymentManualService } from "../services/bookingPaymentManual.service";
import BookingPayment from "../models/BookingPayment";
import Reserva from "../models/Reserva";
import { AppError } from "../errors/AppError";

describe("BookingPaymentManualService (Phase D2)", () => {
  let mongoServer: MongoMemoryServer;

  const validReservaId = () => new mongoose.Types.ObjectId().toHexString();
  const validBarbeariaId = () => new mongoose.Types.ObjectId().toHexString();
  const futureExpiresAt = () => new Date(Date.now() + 15 * 60 * 1000); // 15 minutos no futuro

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
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
  // CRIAÇÃO VÁLIDA
  // =====================================================

  it("deve criar um BookingPayment manual pending válido com dados corretos", async () => {
    const rId = validReservaId();
    const bId = validBarbeariaId();
    const expires = futureExpiresAt();

    const payment = await bookingPaymentManualService.createManualBookingPayment({
      reservaId: rId,
      barbeariaId: bId,
      amountCents: 5000,
      expiresAt: expires,
      metadataSafe: { customNote: "Nota customizada", ref: "XYZ" },
    });

    expect(payment).toBeDefined();
    expect(payment._id).toBeDefined();
    expect(payment.reservaId.toString()).toBe(rId);
    expect(payment.barbeariaId.toString()).toBe(bId);
    expect(payment.provider).toBe("manual");
    expect(payment.amountCents).toBe(5000);
    expect(payment.currency).toBe("BRL");
    expect(payment.status).toBe("pending");
    expect(payment.expiresAt!.getTime()).toBe(expires.getTime());
    expect(payment.metadataSafe).toEqual({ customNote: "Nota customizada", ref: "XYZ" });
  });

  // =====================================================
  // VALIDAÇÕES DE OBJECTID
  // =====================================================

  it("deve rejeitar reservaId inválido", async () => {
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: "invalido",
        barbeariaId: validBarbeariaId(),
        amountCents: 5000,
        expiresAt: futureExpiresAt(),
      })
    ).rejects.toThrow("ID da reserva inválido.");
  });

  it("deve rejeitar barbeariaId inválido", async () => {
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: validReservaId(),
        barbeariaId: "invalido",
        amountCents: 5000,
        expiresAt: futureExpiresAt(),
      })
    ).rejects.toThrow("ID da barbearia inválido.");
  });

  // =====================================================
  // VALIDAÇÃO DE AMOUNTCENTS
  // =====================================================

  it("deve rejeitar amountCents igual a zero", async () => {
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: validReservaId(),
        barbeariaId: validBarbeariaId(),
        amountCents: 0,
        expiresAt: futureExpiresAt(),
      })
    ).rejects.toThrow("O valor em centavos deve ser um número inteiro positivo.");
  });

  it("deve rejeitar amountCents negativo", async () => {
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: validReservaId(),
        barbeariaId: validBarbeariaId(),
        amountCents: -50,
        expiresAt: futureExpiresAt(),
      })
    ).rejects.toThrow("O valor em centavos deve ser um número inteiro positivo.");
  });

  it("deve rejeitar amountCents decimal", async () => {
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: validReservaId(),
        barbeariaId: validBarbeariaId(),
        amountCents: 50.5,
        expiresAt: futureExpiresAt(),
      })
    ).rejects.toThrow("O valor em centavos deve ser um número inteiro positivo.");
  });

  // =====================================================
  // VALIDAÇÃO DE EXPIRESAT
  // =====================================================

  it("deve rejeitar expiresAt passado", async () => {
    const expiredDate = new Date(Date.now() - 5000); // 5s no passado
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: validReservaId(),
        barbeariaId: validBarbeariaId(),
        amountCents: 5000,
        expiresAt: expiredDate,
      })
    ).rejects.toThrow("A data de expiração deve ser no futuro.");
  });

  it("deve rejeitar expiresAt como data inválida", async () => {
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: validReservaId(),
        barbeariaId: validBarbeariaId(),
        amountCents: 5000,
        expiresAt: new Date("data-invalida"),
      })
    ).rejects.toThrow("Data de expiração inválida.");
  });

  // =====================================================
  // SANITIZAÇÃO DE METADATASAFE
  // =====================================================

  it("deve sanitizar metadataSafe removendo chaves sensíveis", async () => {
    const payment = await bookingPaymentManualService.createManualBookingPayment({
      reservaId: validReservaId(),
      barbeariaId: validBarbeariaId(),
      amountCents: 5000,
      expiresAt: futureExpiresAt(),
      metadataSafe: {
        customNote: "Nota ok",
        pixKey: "12345678900", // sensível
        stripe_secret: "sk_test_123", // sensível
        clientCpf: "000.000.000-00", // sensível
        api_token: "xyz123", // sensível
        nested: {
          key: "subkey", // sensível
          safeValue: "ok",
        },
      },
    });

    expect(payment.metadataSafe).toEqual({
      customNote: "Nota ok",
      nested: {
        safeValue: "ok",
      },
    });
  });

  // =====================================================
  // IDEMPOTÊNCIA
  // =====================================================

  it("deve retornar o BookingPayment existente se idempotencyKey for idêntica e com mesmos dados", async () => {
    const rId = validReservaId();
    const bId = validBarbeariaId();
    const expires = futureExpiresAt();
    const key = "unique-idempotency-key-123";

    const payment1 = await bookingPaymentManualService.createManualBookingPayment({
      reservaId: rId,
      barbeariaId: bId,
      amountCents: 5000,
      expiresAt: expires,
      idempotencyKey: key,
    });

    const payment2 = await bookingPaymentManualService.createManualBookingPayment({
      reservaId: rId,
      barbeariaId: bId,
      amountCents: 5000,
      expiresAt: expires,
      idempotencyKey: key,
    });

    expect(payment1._id.toString()).toBe(payment2._id.toString());
    const count = await BookingPayment.countDocuments({ idempotencyKey: key });
    expect(count).toBe(1);
  });

  it("deve rejeitar conflito de idempotência se a mesma chave for reusada com parâmetros diferentes", async () => {
    const rId = validReservaId();
    const bId = validBarbeariaId();
    const expires = futureExpiresAt();
    const key = "unique-idempotency-key-456";

    await bookingPaymentManualService.createManualBookingPayment({
      reservaId: rId,
      barbeariaId: bId,
      amountCents: 5000,
      expiresAt: expires,
      idempotencyKey: key,
    });

    // Reusa a chave com valor diferente
    await expect(
      bookingPaymentManualService.createManualBookingPayment({
        reservaId: rId,
        barbeariaId: bId,
        amountCents: 6000, // difere
        expiresAt: expires,
        idempotencyKey: key,
      })
    ).rejects.toThrow("Chave de idempotência já utilizada com parâmetros diferentes.");
  });

  // =====================================================
  // AUSÊNCIA DE ATIVAÇÃO FUNCIONAL / ISOLAMENTO
  // =====================================================

  it("não deve interagir com o model Reserva durante a criação do pagamento", async () => {
    const rId = validReservaId();
    const bId = validBarbeariaId();
    const expires = futureExpiresAt();

    const initialReservaCount = await Reserva.countDocuments({});
    expect(initialReservaCount).toBe(0);

    await bookingPaymentManualService.createManualBookingPayment({
      reservaId: rId,
      barbeariaId: bId,
      amountCents: 5000,
      expiresAt: expires,
    });

    // Reserva count continua 0 (nenhuma reserva é criada, atualizada ou persistida)
    const finalReservaCount = await Reserva.countDocuments({});
    expect(finalReservaCount).toBe(0);
  });
});
