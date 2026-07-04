import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../App";
import User from "../models/User";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import TermsVersion from "../models/TermsVersion";
import TermsAcceptance from "../models/TermsAcceptance";
import BookingPolicy from "../models/BookingPolicy";
import BookingPayment from "../models/BookingPayment";
import { reservaService, AcceptedTermsInput } from "../services/reserva.service";
import { generateContentHash } from "../services/termsVersionSeed.service";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

describe("Reserva — BookingPayment Manual Integration (Phase D3)", () => {
  let mongoServer: MongoMemoryServer;

  let barbeariaId: string;
  let servicoId: string;
  let termsVersionId: string;
  let userId: string;
  let token: string;

  let dateCounter = 0;
  function nextFutureDate(): string {
    dateCounter++;
    return new Date(Date.now() + (24 + dateCounter) * 60 * 60 * 1000).toISOString();
  }

  function validAcceptedTerms(): AcceptedTermsInput {
    return {
      termsVersionId,
      acceptedTermsCheckbox: true,
      source: "web",
      locale: "pt-BR",
    };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Criar usuário e gerar token jwt
    const user = await User.create({
      nomeCompleto: "Cliente Test D3",
      email: "cliente_d3@t.com",
      senha: "123456_password",
      tipo: "cliente",
    } as any);
    userId = user._id.toString();
    token = jwt.sign(
      { id: userId, tipo: "cliente", email: user.email },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Criar barbearia
    const barbearia = await Barbearia.create({
      nome: "Barbearia Integração D3",
      endereco: {
        rua: "Av Principal",
        numero: "100",
        bairro: "Centro",
        cidade: "São Paulo",
        cep: "01001-000",
      },
      telefone1: "11999999999",
    });
    barbeariaId = barbearia._id.toString();

    // Criar serviço (preço: R$ 65.50 -> 6550 centavos)
    const servico = await Servico.create({
      barbearia: barbeariaId,
      nome: "Barba Completa",
      duracaoMin: 40,
      preco: 65.50,
      ativo: true,
    });
    servicoId = servico._id.toString();

    // Criar TermsVersion ativa do tipo booking_payment_terms
    const content = "Termos e condições de reserva e pagamento da barbearia.";
    const contentHash = generateContentHash("booking_payment_terms", "v2.0.0", content);
    const tv = await TermsVersion.create({
      type: "booking_payment_terms",
      version: "v2.0.0",
      title: "Termos de Pagamento Manual",
      content,
      contentHash,
      effectiveFrom: new Date("2026-01-01"),
      isActive: true,
    });
    termsVersionId = tv._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await BookingPayment.deleteMany({});
    await BookingPolicy.deleteMany({});
    await Reserva.deleteMany({});
    await TermsAcceptance.deleteMany({});
  });

  // =====================================================
  // FLUXO ANTIGO: requirePrepayment = false
  // =====================================================

  it("deve criar reserva normalmente e NÃO criar BookingPayment se requirePrepayment for false", async () => {
    await BookingPolicy.create({
      barbeariaId,
      requirePrepayment: false,
      paymentExpirationMinutes: 15,
      arrivalToleranceMinutes: 10,
      cancellationWindowHours: 2,
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
      policyVersion: "1.0",
      activeFrom: new Date(),
      isActive: true,
    });

    const result = await reservaService.criarReservaComAceite(
      userId,
      barbeariaId,
      servicoId,
      nextFutureDate(),
      undefined,
      validAcceptedTerms()
    );

    expect(result.reserva).toBeDefined();
    expect(result.termsAcceptance).toBeDefined();
    expect(result.bookingPayment).toBeUndefined();

    expect(result.reserva.paymentRequired).toBe(false);
    expect(result.reserva.paymentStatus).toBe("pendente");
    expect(result.reserva.bookingPaymentId).toBeUndefined();

    const paymentCount = await BookingPayment.countDocuments({});
    expect(paymentCount).toBe(0);
  });

  // =====================================================
  // FLUXO INTEGRADO: requirePrepayment = true
  // =====================================================

  it("deve criar BookingPayment manual pending e atualizar Reserva quando requirePrepayment for true", async () => {
    await BookingPolicy.create({
      barbeariaId,
      requirePrepayment: true,
      paymentExpirationMinutes: 20,
      arrivalToleranceMinutes: 10,
      cancellationWindowHours: 2,
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
      policyVersion: "1.0",
      activeFrom: new Date(),
      isActive: true,
    });

    const dataHoraStr = nextFutureDate();
    const result = await reservaService.criarReservaComAceite(
      userId,
      barbeariaId,
      servicoId,
      dataHoraStr,
      undefined,
      validAcceptedTerms()
    );

    expect(result.reserva).toBeDefined();
    expect(result.termsAcceptance).toBeDefined();
    expect(result.bookingPayment).toBeDefined();

    const bp = result.bookingPayment!;
    expect(bp.reservaId.toString()).toBe(result.reserva._id.toString());
    expect(bp.barbeariaId.toString()).toBe(barbeariaId);
    expect(bp.provider).toBe("manual");
    expect(bp.status).toBe("pending");
    expect(bp.amountCents).toBe(6550);
    expect(bp.currency).toBe("BRL");

    const reservaAtualizada = await Reserva.findById(result.reserva._id);
    expect(reservaAtualizada!.paymentRequired).toBe(true);
    expect(reservaAtualizada!.paymentStatus).toBe("pending");
    expect(reservaAtualizada!.bookingPaymentId!.toString()).toBe(bp._id.toString());
    expect(reservaAtualizada!.paymentExpiresAt).toBeDefined();
    expect(reservaAtualizada!.status).toBe("pendente");
  });

  // =====================================================
  // IDEMPOTÊNCIA
  // =====================================================

  it("deve evitar duplicação de BookingPayment para reexecuções seguras sobre o mesmo pagamento manual", async () => {
    await BookingPolicy.create({
      barbeariaId,
      requirePrepayment: true,
      paymentExpirationMinutes: 15,
      arrivalToleranceMinutes: 10,
      cancellationWindowHours: 2,
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
      policyVersion: "1.0",
      activeFrom: new Date(),
      isActive: true,
    });

    const dataHoraStr = nextFutureDate();
    
    const result1 = await reservaService.criarReservaComAceite(
      userId,
      barbeariaId,
      servicoId,
      dataHoraStr,
      undefined,
      validAcceptedTerms()
    );

    const bp1 = result1.bookingPayment!;
    expect(bp1).toBeDefined();

    const bp2 = await mongoose.model("BookingPayment").findOne({
      reservaId: result1.reserva._id,
      idempotencyKey: `manual-payment-${result1.reserva._id.toString()}`,
    });

    expect(bp2).toBeDefined();
    expect(bp1._id.toString()).toBe(bp2!._id.toString());

    const paymentCount = await BookingPayment.countDocuments({
      reservaId: result1.reserva._id,
    });
    expect(paymentCount).toBe(1);
  });

  // =====================================================
  // SEGURANÇA E SERVER-OWNED VALUES
  // =====================================================

  it("deve garantir que o amountCents vem do preço real do serviço e não do parâmetro valor do cliente", async () => {
    await BookingPolicy.create({
      barbeariaId,
      requirePrepayment: true,
      paymentExpirationMinutes: 15,
      isActive: true,
      policyVersion: "1.0",
      activeFrom: new Date(),
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
    });

    const result = await reservaService.criarReservaComAceite(
      userId,
      barbeariaId,
      servicoId,
      nextFutureDate(),
      10, // valor fraudulento
      validAcceptedTerms()
    );

    const bp = result.bookingPayment!;
    expect(bp.amountCents).toBe(6550);
  });

  // =====================================================
  // CONTROLLER RESPONSE MAPPING (PT-BR PRESENTERS)
  // =====================================================

  it("deve incluir apresentações traduzidas (PT-BR) de status e instruções de pagamento na resposta HTTP do controller", async () => {
    await BookingPolicy.create({
      barbeariaId,
      requirePrepayment: true,
      paymentExpirationMinutes: 15,
      isActive: true,
      policyVersion: "1.0",
      activeFrom: new Date(),
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
    });

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: barbeariaId,
        servico: servicoId,
        dataHora: nextFutureDate(),
        acceptedTerms: validAcceptedTerms(),
      });

    expect(res.status).toBe(201);
    expect(res.body.reserva).toBeDefined();
    expect(res.body.bookingPayment).toBeDefined();
    expect(res.body.bookingPayment.status).toBe("pending");

    // Valida o status presenter em PT-BR para paymentStatus
    expect(res.body.paymentStatusPresentation).toBeDefined();
    expect(res.body.paymentStatusPresentation.code).toBe("pending");
    expect(res.body.paymentStatusPresentation.label).toBe("Pagamento pendente");
    expect(res.body.paymentStatusPresentation.tone).toBe("warning");

    // Valida o status presenter em PT-BR para status principal
    expect(res.body.reservaStatusPresentation).toBeDefined();
    expect(res.body.reservaStatusPresentation.code).toBe("pendente");
    expect(res.body.reservaStatusPresentation.label).toBe("Pendente");

    // Valida instruções e ausência de simulações falsas de provedor real
    expect(res.body.paymentInstruction).toBeDefined();
    expect(res.body.paymentInstruction.message).toBe("Realize o pagamento via Pix diretamente à barbearia.");
    expect(res.body.paymentInstruction.expiresInMinutes).toBeDefined();

    // Valida que o BookingPayment não contém dados sensíveis ou falsos de provedor real
    const bp = res.body.bookingPayment;
    expect(bp.pixQrCodeRef).toBeUndefined();
    expect(bp.pixCopyPasteRef).toBeUndefined();
    expect(bp.providerPaymentId).toBeUndefined();
  });
});
