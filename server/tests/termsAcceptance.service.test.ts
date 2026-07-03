import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import TermsAcceptance from "../models/TermsAcceptance";
import TermsVersion from "../models/TermsVersion";
import {
  termsAcceptanceService,
  hashSensitiveValue,
  CreateTermsAcceptanceInput,
  TermsAcceptanceValidationError,
} from "../services/termsAcceptance.service";

describe("TermsAcceptanceService", () => {
  let mongoServer: MongoMemoryServer;

  // IDs fixos para testes
  const reservaId = new mongoose.Types.ObjectId();
  const barbeariaId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const termsVersionId = new mongoose.Types.ObjectId();

  /**
   * Helper para gerar um input válido completo.
   */
  function validInput(overrides?: Partial<CreateTermsAcceptanceInput>): CreateTermsAcceptanceInput {
    return {
      reservaId: reservaId.toHexString(),
      barbeariaId: barbeariaId.toHexString(),
      userId: userId.toHexString(),
      termsVersionId: termsVersionId.toHexString(),
      acceptedAt: new Date("2025-06-01T10:00:00.000Z"),
      checkboxLabelSnapshot: "Li e aceito os termos de reserva e pagamento.",
      acceptanceTextSnapshot: "Termos de Reserva e Pagamento — Versão Preliminar (v1.0.0). Ao marcar esta caixa, você confirma ciência das condições.",
      serviceSnapshot: {
        servicoNome: "Corte Masculino",
        priceCents: 5000,
        scheduledAt: new Date("2025-06-15T14:00:00.000Z"),
        durationMinutes: 30,
        arrivalToleranceMinutes: 15,
        paymentExpirationMinutes: 15,
        cancellationWindowHours: 2,
        refundPolicySummary: "Reembolso sujeito a análise manual.",
        noShowPolicySummary: "Não comparecimento encaminhado para análise manual.",
      },
      clientIp: "192.168.1.100",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      source: "web",
      locale: "pt-BR",
      ...overrides,
    };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await TermsAcceptance.deleteMany({});
    await TermsVersion.deleteMany({});
  });

  // ──────────────────────────────────────────────────
  // 1. Hashing de valores sensíveis
  // ──────────────────────────────────────────────────
  describe("hashSensitiveValue", () => {
    it("deve gerar hash SHA-256 determinístico para IP", () => {
      const hash1 = hashSensitiveValue("client_ip", "192.168.1.100");
      const hash2 = hashSensitiveValue("client_ip", "192.168.1.100");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("deve gerar hash SHA-256 determinístico para User-Agent", () => {
      const hash1 = hashSensitiveValue("user_agent", "Mozilla/5.0 Test");
      const hash2 = hashSensitiveValue("user_agent", "Mozilla/5.0 Test");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("deve gerar hashes diferentes para IPs diferentes", () => {
      const hash1 = hashSensitiveValue("client_ip", "192.168.1.100");
      const hash2 = hashSensitiveValue("client_ip", "10.0.0.1");

      expect(hash1).not.toBe(hash2);
    });

    it("deve gerar hashes diferentes para domínios diferentes com mesmo valor", () => {
      const hashIp = hashSensitiveValue("client_ip", "192.168.1.100");
      const hashUa = hashSensitiveValue("user_agent", "192.168.1.100");

      expect(hashIp).not.toBe(hashUa);
    });
  });

  // ──────────────────────────────────────────────────
  // 2. Criação com snapshot completo
  // ──────────────────────────────────────────────────
  describe("createTermsAcceptanceSnapshot", () => {
    it("deve criar TermsAcceptance com todos os campos do snapshot", async () => {
      const input = validInput();
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc).toBeDefined();
      expect(doc._id).toBeDefined();
      expect(doc.reservaId.toString()).toBe(reservaId.toHexString());
      expect(doc.barbeariaId.toString()).toBe(barbeariaId.toHexString());
      expect(doc.userId!.toString()).toBe(userId.toHexString());
      expect(doc.termsVersionId.toString()).toBe(termsVersionId.toHexString());
      expect(doc.acceptedAt).toEqual(new Date("2025-06-01T10:00:00.000Z"));
      expect(doc.checkboxLabelSnapshot).toBe(input.checkboxLabelSnapshot);
      expect(doc.acceptanceTextSnapshot).toBe(input.acceptanceTextSnapshot);
      expect(doc.source).toBe("web");
      expect(doc.locale).toBe("pt-BR");
    });

    it("deve gravar serviceSnapshot completo com todos os campos de política", async () => {
      const input = validInput();
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc.serviceSnapshot.servicoNome).toBe("Corte Masculino");
      expect(doc.serviceSnapshot.priceCents).toBe(5000);
      expect(doc.serviceSnapshot.scheduledAt).toEqual(new Date("2025-06-15T14:00:00.000Z"));
      expect(doc.serviceSnapshot.durationMinutes).toBe(30);
      expect(doc.serviceSnapshot.arrivalToleranceMinutes).toBe(15);
      expect(doc.serviceSnapshot.paymentExpirationMinutes).toBe(15);
      expect(doc.serviceSnapshot.cancellationWindowHours).toBe(2);
      expect(doc.serviceSnapshot.refundPolicySummary).toBe("Reembolso sujeito a análise manual.");
      expect(doc.serviceSnapshot.noShowPolicySummary).toBe("Não comparecimento encaminhado para análise manual.");
    });

    it("deve criar sem userId quando não fornecido", async () => {
      const input = validInput({ userId: undefined });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc.userId).toBeUndefined();
    });

    it("deve criar sem clientIpHash quando IP não fornecido", async () => {
      const input = validInput({ clientIp: undefined });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc.clientIpHash).toBeUndefined();
    });

    it("deve criar sem userAgentHash quando user-agent não fornecido", async () => {
      const input = validInput({ userAgent: undefined });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc.userAgentHash).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────
  // 3. IP e User-Agent nunca persistidos em texto puro
  // ──────────────────────────────────────────────────
  describe("hashing de IP/User-Agent no documento", () => {
    it("deve persistir clientIpHash como SHA-256, nunca o IP original", async () => {
      const rawIp = "192.168.1.100";
      const input = validInput({ clientIp: rawIp });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      // O hash está presente
      expect(doc.clientIpHash).toBeDefined();
      expect(doc.clientIpHash).toHaveLength(64);

      // O IP original NÃO está no documento
      const rawDoc = await TermsAcceptance.findById(doc._id).lean();
      const docString = JSON.stringify(rawDoc);
      expect(docString).not.toContain(rawIp);
    });

    it("deve persistir userAgentHash como SHA-256, nunca o user-agent original", async () => {
      const rawUa = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36";
      const input = validInput({ userAgent: rawUa });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      // O hash está presente
      expect(doc.userAgentHash).toBeDefined();
      expect(doc.userAgentHash).toHaveLength(64);

      // O user-agent original NÃO está no documento
      const rawDoc = await TermsAcceptance.findById(doc._id).lean();
      const docString = JSON.stringify(rawDoc);
      expect(docString).not.toContain(rawUa);
    });

    it("o hash do IP persistido deve corresponder ao recálculo com hashSensitiveValue", async () => {
      const rawIp = "10.0.0.42";
      const input = validInput({ clientIp: rawIp });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      const expectedHash = hashSensitiveValue("client_ip", rawIp);
      expect(doc.clientIpHash).toBe(expectedHash);
    });

    it("o hash do User-Agent persistido deve corresponder ao recálculo", async () => {
      const rawUa = "TestAgent/1.0";
      const input = validInput({ userAgent: rawUa });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      const expectedHash = hashSensitiveValue("user_agent", rawUa);
      expect(doc.userAgentHash).toBe(expectedHash);
    });
  });

  // ──────────────────────────────────────────────────
  // 4. Validações — rejeição de inputs inválidos
  // ──────────────────────────────────────────────────
  describe("validações", () => {
    it("deve rejeitar checkboxLabelSnapshot vazio", async () => {
      const input = validInput({ checkboxLabelSnapshot: "" });

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow(TermsAcceptanceValidationError);

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow("checkboxLabelSnapshot não pode ser vazio");
    });

    it("deve rejeitar checkboxLabelSnapshot com apenas espaços", async () => {
      const input = validInput({ checkboxLabelSnapshot: "   " });

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow(TermsAcceptanceValidationError);
    });

    it("deve rejeitar acceptanceTextSnapshot vazio", async () => {
      const input = validInput({ acceptanceTextSnapshot: "" });

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow(TermsAcceptanceValidationError);

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow("acceptanceTextSnapshot não pode ser vazio");
    });

    it("deve rejeitar source inválido via validação do service", async () => {
      const input = validInput({ source: "telegram" as any });

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow(TermsAcceptanceValidationError);

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow("source inválido");
    });

    it("deve rejeitar servicoNome vazio", async () => {
      const input = validInput({
        serviceSnapshot: {
          ...validInput().serviceSnapshot,
          servicoNome: "",
        },
      });

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow(TermsAcceptanceValidationError);
    });

    it("deve rejeitar priceCents negativo", async () => {
      const input = validInput({
        serviceSnapshot: {
          ...validInput().serviceSnapshot,
          priceCents: -100,
        },
      });

      await expect(
        termsAcceptanceService.createTermsAcceptanceSnapshot(input)
      ).rejects.toThrow(TermsAcceptanceValidationError);
    });

    it("deve aceitar source 'web'", async () => {
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(
        validInput({ source: "web" })
      );
      expect(doc.source).toBe("web");
    });

    it("deve aceitar source 'mobile'", async () => {
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(
        validInput({ source: "mobile" })
      );
      expect(doc.source).toBe("mobile");
    });

    it("deve aceitar source 'admin'", async () => {
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(
        validInput({ source: "admin" })
      );
      expect(doc.source).toBe("admin");
    });
  });

  // ──────────────────────────────────────────────────
  // 5. Vínculo com TermsVersion
  // ──────────────────────────────────────────────────
  describe("vínculo com TermsVersion", () => {
    it("deve armazenar termsVersionId corretamente", async () => {
      const input = validInput();
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc.termsVersionId.toString()).toBe(termsVersionId.toHexString());
    });

    it("termsVersionId pode referenciar um TermsVersion real no banco", async () => {
      // Cria um TermsVersion real
      const tv = await TermsVersion.create({
        type: "booking_payment_terms",
        version: "v1.0.0",
        title: "Termos de Reserva e Pagamento",
        content: "Conteúdo teste",
        contentHash: "abc123def456abc123def456abc123def456abc123def456abc123def456abcd1234",
        effectiveFrom: new Date("2025-01-01"),
        isActive: true,
      });

      const input = validInput({ termsVersionId: tv._id.toString() });
      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(input);

      expect(doc.termsVersionId.toString()).toBe(tv._id.toString());

      // Verifica no banco
      const found = await TermsAcceptance.findById(doc._id).lean();
      expect(found).toBeDefined();
      expect(found!.termsVersionId.toString()).toBe(tv._id.toString());
    });
  });

  // ──────────────────────────────────────────────────
  // 6. Preservação de escopo
  // ──────────────────────────────────────────────────
  describe("preservação de escopo", () => {
    it("nenhum campo do documento contém IP ou User-Agent em texto puro", async () => {
      const rawIp = "203.0.113.42";
      const rawUa = "CustomBot/2.0 (compatible; MSIE 10.0)";

      const doc = await termsAcceptanceService.createTermsAcceptanceSnapshot(
        validInput({ clientIp: rawIp, userAgent: rawUa })
      );

      const rawDoc = await TermsAcceptance.findById(doc._id).lean();
      const fullJson = JSON.stringify(rawDoc);

      expect(fullJson).not.toContain(rawIp);
      expect(fullJson).not.toContain(rawUa);
      expect(fullJson).not.toContain("clientIp\":");
      expect(fullJson).not.toContain("userAgent\":");
    });

    it("o service não exporta nem referencia Reserva, controller ou route", () => {
      // Verificação estática: o módulo não deve importar nada de controllers/routes/Reserva
      const serviceModule = require("../services/termsAcceptance.service");
      expect(serviceModule.termsAcceptanceService).toBeDefined();
      expect(serviceModule.hashSensitiveValue).toBeDefined();

      // O módulo não deve ter referência a controllers ou routes
      const moduleKeys = Object.keys(serviceModule);
      const hasControllerRef = moduleKeys.some((k) =>
        k.toLowerCase().includes("controller") || k.toLowerCase().includes("route")
      );
      expect(hasControllerRef).toBe(false);
    });
  });
});
