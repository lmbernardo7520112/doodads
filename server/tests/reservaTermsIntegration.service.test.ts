import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import TermsVersion from "../models/TermsVersion";
import TermsAcceptance from "../models/TermsAcceptance";
import BookingPolicy from "../models/BookingPolicy";
import { reservaService, AcceptedTermsInput } from "../services/reserva.service";
import { generateContentHash } from "../services/termsVersionSeed.service";
import { hashSensitiveValue } from "../services/termsAcceptance.service";

describe("ReservaService — criarReservaComAceite (Phase C4)", () => {
  let mongoServer: MongoMemoryServer;

  // IDs fixos
  let barbeariaId: string;
  let servicoId: string;
  let termsVersionId: string;
  const usuarioId = new mongoose.Types.ObjectId().toHexString();
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // amanhã

  // Helper para criar um novo futureDate sem conflito
  let dateCounter = 0;
  function nextFutureDate(): string {
    dateCounter++;
    return new Date(Date.now() + (24 + dateCounter) * 60 * 60 * 1000).toISOString();
  }

  function validAcceptedTerms(overrides?: Partial<AcceptedTermsInput>): AcceptedTermsInput {
    return {
      termsVersionId,
      acceptedTermsCheckbox: true,
      source: "web",
      locale: "pt-BR",
      ...overrides,
    };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Criar barbearia
    const barbearia = await Barbearia.create({
      nome: "Barbearia Teste C4",
      endereco: {
        rua: "Rua Teste",
        numero: "123",
        bairro: "Centro",
        cidade: "São Paulo",
        cep: "01001-000",
      },
      telefone1: "11999999999",
    });
    barbeariaId = barbearia._id.toString();

    // Criar serviço
    const servico = await Servico.create({
      barbearia: barbeariaId,
      nome: "Corte Masculino",
      duracaoMin: 30,
      preco: 50.0,
      ativo: true,
    });
    servicoId = servico._id.toString();

    // Criar TermsVersion ativa do tipo booking_payment_terms
    const content = "Termos de teste v1.0.0 para integração C4.";
    const contentHash = generateContentHash("booking_payment_terms", "v1.0.0", content);
    const tv = await TermsVersion.create({
      type: "booking_payment_terms",
      version: "v1.0.0",
      title: "Termos de Reserva e Pagamento",
      content,
      contentHash,
      effectiveFrom: new Date("2025-01-01"),
      isActive: true,
    });
    termsVersionId = tv._id.toString();

    // Criar BookingPolicy default
    await BookingPolicy.create({
      barbeariaId,
      requirePrepayment: false,
      paymentExpirationMinutes: 15,
      arrivalToleranceMinutes: 15,
      cancellationWindowHours: 2,
      refundPolicy: "manual_review",
      noShowPolicy: "manual_review",
      policyVersion: "1.0",
      activeFrom: new Date(),
      isActive: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Reserva.deleteMany({});
    await TermsAcceptance.deleteMany({});
  });

  // =====================================================
  // RETROCOMPATIBILIDADE — fluxo antigo sem acceptedTerms
  // =====================================================

  describe("Retrocompatibilidade: criarReserva (sem acceptedTerms)", () => {
    it("deve criar reserva normalmente sem acceptedTerms", async () => {
      const dt = nextFutureDate();
      const reserva = await reservaService.criarReserva(
        usuarioId, barbeariaId, servicoId, dt
      );
      expect(reserva).toBeDefined();
      expect(reserva.status).toBe("pendente");
      expect(reserva.paymentStatus).toBe("pendente");

      // Nenhum TermsAcceptance deve ter sido criado
      const count = await TermsAcceptance.countDocuments({});
      expect(count).toBe(0);
    });
  });

  // =====================================================
  // FLUXO COM ACEITE — criarReservaComAceite
  // =====================================================

  describe("criarReservaComAceite com input válido", () => {
    it("deve criar reserva + TermsAcceptance com snapshot server-owned", async () => {
      const dt = nextFutureDate();
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms(),
        "192.168.1.100",
        "Mozilla/5.0 Test"
      );

      // Reserva criada
      expect(result.reserva).toBeDefined();
      expect(result.reserva.status).toBe("pendente");
      expect(result.reserva.paymentStatus).toBe("pendente");

      // TermsAcceptance criado
      const ta = result.termsAcceptance;
      expect(ta).toBeDefined();
      expect(ta.reservaId.toString()).toBe(result.reserva._id.toString());
      expect(ta.barbeariaId.toString()).toBe(barbeariaId);
      expect(ta.termsVersionId.toString()).toBe(termsVersionId);
      expect(ta.source).toBe("web");
      expect(ta.locale).toBe("pt-BR");
    });

    it("deve montar snapshot com dados reais do servidor, não do cliente", async () => {
      const dt = nextFutureDate();
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms(),
        "10.0.0.1",
        "TestAgent/1.0"
      );

      const ta = result.termsAcceptance;

      // checkboxLabelSnapshot gerado pelo backend
      expect(ta.checkboxLabelSnapshot).toBe(
        "Li e aceito os Termos de Reserva e Pagamento (versão v1.0.0)."
      );

      // acceptanceTextSnapshot é o conteúdo da TermsVersion
      expect(ta.acceptanceTextSnapshot).toBe("Termos de teste v1.0.0 para integração C4.");

      // serviceSnapshot usa dados reais do Servico e BookingPolicy
      expect(ta.serviceSnapshot.servicoNome).toBe("Corte Masculino");
      expect(ta.serviceSnapshot.priceCents).toBe(5000); // R$ 50,00 * 100
      expect(ta.serviceSnapshot.durationMinutes).toBe(30);
      expect(ta.serviceSnapshot.arrivalToleranceMinutes).toBe(15);
      expect(ta.serviceSnapshot.paymentExpirationMinutes).toBe(15);
      expect(ta.serviceSnapshot.cancellationWindowHours).toBe(2);
      expect(ta.serviceSnapshot.refundPolicySummary).toBe("Reembolso sujeito a análise manual.");
      expect(ta.serviceSnapshot.noShowPolicySummary).toBe("Não comparecimento encaminhado para análise manual.");
    });

    it("deve hashear IP e User-Agent via hashSensitiveValue", async () => {
      const dt = nextFutureDate();
      const testIp = "203.0.113.42";
      const testUa = "Mozilla/5.0 (X11; Linux)";
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms(),
        testIp, testUa
      );

      const ta = result.termsAcceptance;

      // Hashes devem corresponder
      expect(ta.clientIpHash).toBe(hashSensitiveValue("client_ip", testIp));
      expect(ta.userAgentHash).toBe(hashSensitiveValue("user_agent", testUa));

      // IP/UA puros nunca no documento
      const json = JSON.stringify(ta.toJSON());
      expect(json).not.toContain(testIp);
      expect(json).not.toContain(testUa);
    });

    it("deve funcionar sem IP e User-Agent (undefined)", async () => {
      const dt = nextFutureDate();
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms()
        // sem clientIp, sem userAgent
      );

      expect(result.termsAcceptance.clientIpHash).toBeUndefined();
      expect(result.termsAcceptance.userAgentHash).toBeUndefined();
    });

    it("deve usar locale default pt-BR quando omitido", async () => {
      const dt = nextFutureDate();
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms({ locale: undefined })
      );

      expect(result.termsAcceptance.locale).toBe("pt-BR");
    });
  });

  // =====================================================
  // VALIDAÇÕES — checkbox, termsVersion, type
  // =====================================================

  describe("Validações de acceptedTerms", () => {
    it("deve rejeitar checkbox false com TERMS_CHECKBOX_NOT_ACCEPTED", async () => {
      const dt = nextFutureDate();
      await expect(
        reservaService.criarReservaComAceite(
          usuarioId, barbeariaId, servicoId, dt, undefined,
          validAcceptedTerms({ acceptedTermsCheckbox: false })
        )
      ).rejects.toMatchObject({ code: "TERMS_CHECKBOX_NOT_ACCEPTED", statusCode: 400 });
    });

    it("deve rejeitar termsVersionId inexistente com TERMS_VERSION_NOT_FOUND", async () => {
      const dt = nextFutureDate();
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      await expect(
        reservaService.criarReservaComAceite(
          usuarioId, barbeariaId, servicoId, dt, undefined,
          validAcceptedTerms({ termsVersionId: fakeId })
        )
      ).rejects.toMatchObject({ code: "TERMS_VERSION_NOT_FOUND", statusCode: 404 });
    });

    it("deve rejeitar TermsVersion inativa com TERMS_VERSION_INACTIVE", async () => {
      // Criar uma TermsVersion inativa
      const inactiveTv = await TermsVersion.create({
        type: "booking_payment_terms",
        version: "v0.1.0-inactive",
        title: "Termos Inativos",
        content: "Conteúdo inativo.",
        contentHash: generateContentHash("booking_payment_terms", "v0.1.0-inactive", "Conteúdo inativo."),
        effectiveFrom: new Date("2024-01-01"),
        isActive: false,
      });

      const dt = nextFutureDate();
      await expect(
        reservaService.criarReservaComAceite(
          usuarioId, barbeariaId, servicoId, dt, undefined,
          validAcceptedTerms({ termsVersionId: inactiveTv._id.toString() })
        )
      ).rejects.toMatchObject({ code: "TERMS_VERSION_INACTIVE", statusCode: 409 });
    });

    it("deve rejeitar TermsVersion de tipo incorreto com TERMS_VERSION_TYPE_MISMATCH", async () => {
      // Criar TermsVersion ativa mas de tipo diferente
      const wrongTypeTv = await TermsVersion.create({
        type: "cancellation_policy",
        version: "v1.0.0-wrong",
        title: "Política de Cancelamento",
        content: "Conteúdo de cancelamento.",
        contentHash: generateContentHash("cancellation_policy", "v1.0.0-wrong", "Conteúdo de cancelamento."),
        effectiveFrom: new Date("2025-01-01"),
        isActive: true,
      });

      const dt = nextFutureDate();
      await expect(
        reservaService.criarReservaComAceite(
          usuarioId, barbeariaId, servicoId, dt, undefined,
          validAcceptedTerms({ termsVersionId: wrongTypeTv._id.toString() })
        )
      ).rejects.toMatchObject({ code: "TERMS_VERSION_TYPE_MISMATCH", statusCode: 400 });
    });
  });

  // =====================================================
  // PROTEÇÃO CONTRA MASS ASSIGNMENT
  // =====================================================

  describe("Proteção contra mass assignment", () => {
    it("deve ignorar campos server-owned enviados pelo cliente no acceptedTerms", async () => {
      const dt = nextFutureDate();
      // Cliente tenta enviar campos que deveriam ser server-owned
      const maliciousInput: any = {
        ...validAcceptedTerms(),
        checkboxLabelSnapshot: "MALICIOSO",
        serviceSnapshot: { servicoNome: "HACKEADO", priceCents: 0 },
        clientIpHash: "hash-falso",
        acceptedAt: new Date("2000-01-01"),
      };

      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        maliciousInput
      );

      const ta = result.termsAcceptance;

      // Backend deve ter gerado os valores corretos, ignorando maliciosos
      expect(ta.checkboxLabelSnapshot).toBe(
        "Li e aceito os Termos de Reserva e Pagamento (versão v1.0.0)."
      );
      expect(ta.serviceSnapshot.servicoNome).toBe("Corte Masculino");
      expect(ta.serviceSnapshot.priceCents).toBe(5000);
      expect(ta.clientIpHash).toBeUndefined(); // não foi passado clientIp real
    });
  });

  // =====================================================
  // AUSÊNCIA DE PIX / PAYMENT_PENDING
  // =====================================================

  describe("Ausência de Pix e payment_pending", () => {
    it("não deve alterar status da reserva para payment_pending", async () => {
      const dt = nextFutureDate();
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms()
      );

      expect(result.reserva.status).toBe("pendente");
      expect(result.reserva.paymentStatus).toBe("pendente");
      // Nenhum paymentId atribuído
      expect(result.reserva.paymentId).toBeUndefined();
    });
  });

  // =====================================================
  // RESERVA.TS INALTERADO
  // =====================================================

  describe("Reserva.ts inalterado (sem termsAcceptanceId)", () => {
    it("reserva criada com aceite não possui campo termsAcceptanceId no model", async () => {
      const dt = nextFutureDate();
      const result = await reservaService.criarReservaComAceite(
        usuarioId, barbeariaId, servicoId, dt, undefined,
        validAcceptedTerms()
      );

      // O model Reserva.ts não tem termsAcceptanceId — a vinculação é via TermsAcceptance.reservaId
      const reservaDoc = result.reserva.toJSON();
      expect(reservaDoc).not.toHaveProperty("termsAcceptanceId");
    });
  });
});
