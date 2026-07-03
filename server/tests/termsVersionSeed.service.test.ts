import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import TermsVersion from "../models/TermsVersion";
import {
  termsVersionSeedService,
  generateContentHash,
  INITIAL_TERMS_DEFINITIONS,
  TermsSeedDefinition,
} from "../services/termsVersionSeed.service";

describe("TermsVersionSeedService", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await TermsVersion.deleteMany({});
  });

  // ──────────────────────────────────────────────────
  // 1. Geração de contentHash
  // ──────────────────────────────────────────────────
  describe("generateContentHash", () => {
    it("deve gerar um hash SHA-256 determinístico para o mesmo input", () => {
      const hash1 = generateContentHash("booking_payment_terms", "v1.0.0", "conteúdo de teste");
      const hash2 = generateContentHash("booking_payment_terms", "v1.0.0", "conteúdo de teste");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it("deve gerar hashes diferentes para conteúdos diferentes", () => {
      const hash1 = generateContentHash("booking_payment_terms", "v1.0.0", "conteúdo A");
      const hash2 = generateContentHash("booking_payment_terms", "v1.0.0", "conteúdo B");

      expect(hash1).not.toBe(hash2);
    });

    it("deve gerar hashes diferentes para tipos diferentes com mesmo conteúdo", () => {
      const hash1 = generateContentHash("booking_payment_terms", "v1.0.0", "conteúdo igual");
      const hash2 = generateContentHash("cancellation_policy", "v1.0.0", "conteúdo igual");

      expect(hash1).not.toBe(hash2);
    });

    it("deve gerar hashes diferentes para versões diferentes com mesmo conteúdo", () => {
      const hash1 = generateContentHash("booking_payment_terms", "v1.0.0", "conteúdo igual");
      const hash2 = generateContentHash("booking_payment_terms", "v2.0.0", "conteúdo igual");

      expect(hash1).not.toBe(hash2);
    });
  });

  // ──────────────────────────────────────────────────
  // 2. Criação das TermsVersion iniciais
  // ──────────────────────────────────────────────────
  describe("seedAllInitialTerms", () => {
    it("deve criar todas as 3 TermsVersion iniciais", async () => {
      const { results } = await termsVersionSeedService.seedAllInitialTerms();

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.created)).toBe(true);

      // Verifica que cada tipo esperado foi criado
      const types = results.map((r) => r.type);
      expect(types).toContain("booking_payment_terms");
      expect(types).toContain("cancellation_policy");
      expect(types).toContain("no_show_policy");

      // Verifica no banco
      const totalDocs = await TermsVersion.countDocuments({});
      expect(totalDocs).toBe(3);
    });

    it("todos os termos devem ter version v1.0.0", async () => {
      await termsVersionSeedService.seedAllInitialTerms();

      const docs = await TermsVersion.find({});
      for (const doc of docs) {
        expect(doc.version).toBe("v1.0.0");
      }
    });

    it("todos os termos devem ter isActive: true", async () => {
      await termsVersionSeedService.seedAllInitialTerms();

      const docs = await TermsVersion.find({});
      for (const doc of docs) {
        expect(doc.isActive).toBe(true);
      }
    });

    it("todos os termos devem ter effectiveFrom definido", async () => {
      await termsVersionSeedService.seedAllInitialTerms();

      const docs = await TermsVersion.find({});
      for (const doc of docs) {
        expect(doc.effectiveFrom).toBeDefined();
        expect(doc.effectiveFrom).toBeInstanceOf(Date);
      }
    });

    it("todos os termos devem ter contentHash válido de 64 caracteres", async () => {
      await termsVersionSeedService.seedAllInitialTerms();

      const docs = await TermsVersion.find({});
      for (const doc of docs) {
        expect(doc.contentHash).toBeDefined();
        expect(doc.contentHash).toHaveLength(64);
      }
    });

    it("o contentHash salvo deve corresponder ao hash recalculado do conteúdo", async () => {
      await termsVersionSeedService.seedAllInitialTerms();

      const docs = await TermsVersion.find({});
      for (const doc of docs) {
        const expectedHash = generateContentHash(doc.type, doc.version, doc.content);
        expect(doc.contentHash).toBe(expectedHash);
      }
    });
  });

  // ──────────────────────────────────────────────────
  // 3. Idempotência da seed
  // ──────────────────────────────────────────────────
  describe("idempotência", () => {
    it("deve ser idempotente: rodar 2x não duplica documentos", async () => {
      const run1 = await termsVersionSeedService.seedAllInitialTerms();
      expect(run1.results.every((r) => r.created)).toBe(true);

      const run2 = await termsVersionSeedService.seedAllInitialTerms();
      expect(run2.results.every((r) => r.created)).toBe(false);

      const totalDocs = await TermsVersion.countDocuments({});
      expect(totalDocs).toBe(3);
    });

    it("deve ser idempotente: rodar 3x não duplica documentos", async () => {
      await termsVersionSeedService.seedAllInitialTerms();
      await termsVersionSeedService.seedAllInitialTerms();
      await termsVersionSeedService.seedAllInitialTerms();

      const totalDocs = await TermsVersion.countDocuments({});
      expect(totalDocs).toBe(3);
    });

    it("seedSingleTerm não deve duplicar quando contentHash já existe", async () => {
      const definition = INITIAL_TERMS_DEFINITIONS[0];

      const first = await termsVersionSeedService.seedSingleTerm(definition);
      expect(first.created).toBe(true);

      const second = await termsVersionSeedService.seedSingleTerm(definition);
      expect(second.created).toBe(false);
      expect(second.doc._id.toString()).toBe(first.doc._id.toString());
    });
  });

  // ──────────────────────────────────────────────────
  // 4. Não duplicação de versões ativas iguais
  // ──────────────────────────────────────────────────
  describe("não duplicação de versões ativas", () => {
    it("não deve existir mais de um documento ativo por tipo após seed", async () => {
      await termsVersionSeedService.seedAllInitialTerms();

      for (const def of INITIAL_TERMS_DEFINITIONS) {
        const activeCount = await TermsVersion.countDocuments({
          type: def.type,
          isActive: true,
        });
        expect(activeCount).toBe(1);
      }
    });

    it("após múltiplas execuções, cada tipo deve ter exatamente 1 ativo", async () => {
      await termsVersionSeedService.seedAllInitialTerms();
      await termsVersionSeedService.seedAllInitialTerms();
      await termsVersionSeedService.seedAllInitialTerms();

      for (const def of INITIAL_TERMS_DEFINITIONS) {
        const activeCount = await TermsVersion.countDocuments({
          type: def.type,
          isActive: true,
        });
        expect(activeCount).toBe(1);
      }
    });
  });

  // ──────────────────────────────────────────────────
  // 5. Rejeição de type inválido pelo schema
  // ──────────────────────────────────────────────────
  describe("validação de schema", () => {
    it("deve rejeitar criação com type inválido", async () => {
      await expect(
        TermsVersion.create({
          type: "tipo_invalido" as any,
          version: "v1.0.0",
          title: "Teste Inválido",
          content: "Conteúdo teste",
          contentHash: "abc123",
          effectiveFrom: new Date(),
          isActive: true,
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar criação sem campos obrigatórios", async () => {
      await expect(
        TermsVersion.create({
          type: "booking_payment_terms",
          // version missing
          // title missing
          // content missing
          // contentHash missing
          // effectiveFrom missing
        } as any)
      ).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────────
  // 6. Preservação de escopo — sem TermsAcceptance no fluxo
  // ──────────────────────────────────────────────────
  describe("preservação de escopo", () => {
    it("INITIAL_TERMS_DEFINITIONS contém exatamente os 3 tipos esperados", () => {
      const types = INITIAL_TERMS_DEFINITIONS.map((d) => d.type);
      expect(types).toEqual(
        expect.arrayContaining(["booking_payment_terms", "cancellation_policy", "no_show_policy"])
      );
      expect(types).toHaveLength(3);
    });

    it("nenhum termo inclui referência a TermsAcceptance ou aceitação automática", () => {
      for (const def of INITIAL_TERMS_DEFINITIONS) {
        expect(def.content.toLowerCase()).not.toContain("termsacceptance");
        expect(def.content.toLowerCase()).not.toContain("aceite automático");
        expect(def.content.toLowerCase()).not.toContain("checkbox obrigatório");
      }
    });

    it("nenhum termo inclui referência a Pix real, webhook ou QR Code", () => {
      for (const def of INITIAL_TERMS_DEFINITIONS) {
        const lower = def.content.toLowerCase();
        expect(lower).not.toContain("chave pix real");
        expect(lower).not.toContain("webhook");
        expect(lower).not.toContain("qr code real");
        expect(lower).not.toContain("provider real");
      }
    });

    it("todos os termos mencionam que são preliminares e sujeitos a revisão", () => {
      for (const def of INITIAL_TERMS_DEFINITIONS) {
        const lower = def.content.toLowerCase();
        expect(lower).toContain("preliminar");
        expect(lower).toContain("revisad");
      }
    });

    it("todos os termos mencionam ausência de penalidade automática ou análise manual", () => {
      for (const def of INITIAL_TERMS_DEFINITIONS) {
        const lower = def.content.toLowerCase();
        const hasSafeguard =
          lower.includes("análise manual") ||
          lower.includes("penalidade") ||
          lower.includes("nenhuma penalidade automática");
        expect(hasSafeguard).toBe(true);
      }
    });
  });
});
