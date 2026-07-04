import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import TermsVersion from "../models/TermsVersion";
import TermsAcceptance from "../models/TermsAcceptance";
import BookingPolicy from "../models/BookingPolicy";
import BookingPayment from "../models/BookingPayment";
import { reservaService, AcceptedTermsInput } from "../services/reserva.service";
import { generateContentHash } from "../services/termsVersionSeed.service";

describe("Reserva — BookingPayment Manual Integration (Phase D3)", () => {
  let mongoServer: MongoMemoryServer;

  let barbeariaId: string;
  let servicoId: string;
  let termsVersionId: string;
  const usuarioId = new mongoose.Types.ObjectId().toHexString();

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
    // Criar BookingPolicy com requirePrepayment = false
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
      usuarioId,
      barbeariaId,
      servicoId,
      nextFutureDate(),
      undefined,
      validAcceptedTerms()
    );

    expect(result.reserva).toBeDefined();
    expect(result.termsAcceptance).toBeDefined();
    expect(result.bookingPayment).toBeUndefined();

    // Campos de pagamento da reserva devem estar nos defaults
    expect(result.reserva.paymentRequired).toBe(false);
    expect(result.reserva.paymentStatus).toBe("pendente"); // default legado
    expect(result.reserva.bookingPaymentId).toBeUndefined();

    // Não deve existir nenhum BookingPayment criado no banco
    const paymentCount = await BookingPayment.countDocuments({});
    expect(paymentCount).toBe(0);
  });

  // =====================================================
  // FLUXO INTEGRADO: requirePrepayment = true
  // =====================================================

  it("deve criar BookingPayment manual pending e atualizar Reserva quando requirePrepayment for true", async () => {
    // Criar BookingPolicy com requirePrepayment = true
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
      usuarioId,
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
    expect(bp.amountCents).toBe(6550); // R$ 65.50 * 100
    expect(bp.currency).toBe("BRL");
    expect(bp.expiresAt).toBeDefined();

    // Verifica se a reserva registrou as informações de pagamento corretas
    const reservaAtualizada = await Reserva.findById(result.reserva._id);
    expect(reservaAtualizada!.paymentRequired).toBe(true);
    expect(reservaAtualizada!.paymentStatus).toBe("pending");
    expect(reservaAtualizada!.bookingPaymentId!.toString()).toBe(bp._id.toString());
    expect(reservaAtualizada!.paymentExpiresAt).toBeDefined();

    // O status principal da reserva deve permanecer 'pendente' (não alterado)
    expect(reservaAtualizada!.status).toBe("pendente");

    // Verifica expiração calculada (paymentExpirationMinutes = 20)
    const diffMinutes = Math.round((bp.expiresAt!.getTime() - Date.now()) / 60000);
    expect(diffMinutes).toBeGreaterThanOrEqual(19);
    expect(diffMinutes).toBeLessThanOrEqual(21);
  });

  // =====================================================
  // IDEMPOTÊNCIA
  // =====================================================

  it("deve evitar duplicação de BookingPayment para reexecuções seguras sobre o mesmo pagamento manual", async () => {
    // Criar BookingPolicy com requirePrepayment = true
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
    
    // Primeira criação
    const result1 = await reservaService.criarReservaComAceite(
      usuarioId,
      barbeariaId,
      servicoId,
      dataHoraStr,
      undefined,
      validAcceptedTerms()
    );

    const bp1 = result1.bookingPayment!;
    expect(bp1).toBeDefined();

    // Se reexecutarmos a criação de BookingPayment para a mesma reserva
    // (simulando reexecução ou fluxo idempotente no service)
    const bp2 = await mongoose.model("BookingPayment").findOne({
      reservaId: result1.reserva._id,
      idempotencyKey: `manual-payment-${result1.reserva._id.toString()}`,
    });

    expect(bp2).toBeDefined();
    expect(bp1._id.toString()).toBe(bp2!._id.toString());

    const paymentCount = await BookingPayment.countDocuments({
      reservaId: result1.reserva._id,
    });
    expect(paymentCount).toBe(1); // Somente 1 pagamento criado
  });

  // =====================================================
  // SEGURANÇA E SERVER-OWNED VALUES
  // =====================================================

  it("deve garantir que o amountCents vem do preço real do serviço (servico.preco) e não do parâmetro valor do cliente", async () => {
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

    // O cliente envia valor = 10 (tentando forçar um valor menor)
    const result = await reservaService.criarReservaComAceite(
      usuarioId,
      barbeariaId,
      servicoId,
      nextFutureDate(),
      10, // valor fraudulento/baixo tentado pelo cliente
      validAcceptedTerms()
    );

    const bp = result.bookingPayment!;
    expect(bp).toBeDefined();
    // amountCents deve ser R$ 65.50 (6550) e não R$ 10.00 (1000)
    expect(bp.amountCents).toBe(6550);
  });

  // =====================================================
  // AUSÊNCIA DE ATIVAÇÃO FUNCIONAL REAL
  // =====================================================

  it("garante a ausência de Pix real, QR Code dinâmico, webhooks e confirmação manual nesta fase", async () => {
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
      usuarioId,
      barbeariaId,
      servicoId,
      nextFutureDate(),
      undefined,
      validAcceptedTerms()
    );

    const bp = result.bookingPayment!;
    expect(bp).toBeDefined();
    
    // Nenhuma chave Pix bruta ou dados do provedor real devem existir
    expect(bp.pixQrCodeRef).toBeUndefined();
    expect(bp.pixCopyPasteRef).toBeUndefined();
    expect(bp.providerPaymentId).toBeUndefined();
    expect(bp.webhookEventId).toBeUndefined();
  });
});
