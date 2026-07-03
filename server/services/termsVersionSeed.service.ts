import crypto from "crypto";
import { termsVersionRepository } from "../repositories/termsVersion.repository";
import { ITermsVersion } from "../models/TermsVersion";

/**
 * Gera um hash SHA-256 determinístico a partir do conteúdo textual dos termos.
 * O hash é baseado na combinação de type + version + content, garantindo
 * que qualquer alteração nestes campos produza um hash diferente.
 */
export function generateContentHash(type: string, version: string, content: string): string {
  const payload = `${type}::${version}::${content}`;
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

/**
 * Definição de um termo seed.
 */
export interface TermsSeedDefinition {
  type: "booking_payment_terms" | "cancellation_policy" | "no_show_policy" | "privacy_policy";
  version: string;
  title: string;
  content: string;
  effectiveFrom: Date;
}

/**
 * Textos conservadores iniciais dos termos de reserva/pagamento.
 * NÃO são definitivos juridicamente. Serão revisados antes de uso comercial.
 */
export const INITIAL_TERMS_DEFINITIONS: TermsSeedDefinition[] = [
  {
    type: "booking_payment_terms",
    version: "v1.0.0",
    title: "Termos de Reserva e Pagamento",
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    content: [
      "TERMOS DE RESERVA E PAGAMENTO — VERSÃO PRELIMINAR (v1.0.0)",
      "",
      "1. Estes termos descrevem as condições gerais para agendamento e eventual pagamento de serviços de barbearia através da plataforma Doodads.",
      "",
      "2. A reserva de horário pode estar sujeita a regras específicas definidas por cada barbearia, incluindo exigência de pré-pagamento, tolerância de chegada e janela de cancelamento.",
      "",
      "3. Quando aplicável, o pagamento será processado exclusivamente por meios eletrônicos disponibilizados na plataforma. Nenhum dado financeiro sensível é armazenado diretamente pela plataforma.",
      "",
      "4. Eventuais reembolsos ou contestações serão analisados caso a caso, podendo ser encaminhados para análise manual pela equipe responsável.",
      "",
      "5. Nenhuma penalidade financeira automática será aplicada nesta fase inicial da plataforma.",
      "",
      "6. Estes termos são preliminares e poderão ser revisados, atualizados ou substituídos antes do uso comercial definitivo da plataforma. O usuário será notificado de qualquer alteração relevante.",
      "",
      "7. A utilização da plataforma implica ciência destas condições, sem prejuízo dos direitos previstos no Código de Defesa do Consumidor (CDC) e na Lei Geral de Proteção de Dados (LGPD).",
    ].join("\n"),
  },
  {
    type: "cancellation_policy",
    version: "v1.0.0",
    title: "Política de Cancelamento",
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    content: [
      "POLÍTICA DE CANCELAMENTO — VERSÃO PRELIMINAR (v1.0.0)",
      "",
      "1. O cancelamento de reservas poderá ser realizado pelo cliente através da plataforma, respeitando a janela de cancelamento definida pela barbearia.",
      "",
      "2. Cancelamentos realizados dentro da janela permitida não implicam penalidades ao cliente.",
      "",
      "3. Cancelamentos fora da janela permitida poderão ser encaminhados para análise manual, sem aplicação automática de penalidades nesta fase.",
      "",
      "4. A barbearia poderá definir regras próprias de cancelamento, que serão apresentadas ao cliente no momento da reserva.",
      "",
      "5. Em caso de pré-pagamento, o eventual reembolso será analisado manualmente pela equipe responsável, conforme as regras vigentes da barbearia e os direitos do consumidor.",
      "",
      "6. Esta política é preliminar e poderá ser revisada antes do uso comercial definitivo. O usuário será informado de quaisquer alterações.",
    ].join("\n"),
  },
  {
    type: "no_show_policy",
    version: "v1.0.0",
    title: "Política de Não Comparecimento (No-Show)",
    effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    content: [
      "POLÍTICA DE NÃO COMPARECIMENTO (NO-SHOW) — VERSÃO PRELIMINAR (v1.0.0)",
      "",
      "1. Caso o cliente não compareça ao horário agendado dentro da tolerância de chegada definida pela barbearia, a reserva poderá ser marcada como 'não comparecimento' (no-show).",
      "",
      "2. Nenhuma penalidade automática será aplicada ao cliente nesta fase da plataforma. Casos de não comparecimento serão encaminhados para análise manual quando aplicável.",
      "",
      "3. A barbearia poderá definir políticas próprias de tolerância e consequências para não comparecimento, que serão comunicadas ao cliente no momento da reserva.",
      "",
      "4. O registro de não comparecimento poderá ser utilizado pela barbearia para fins de gestão interna, sem compartilhamento de dados pessoais com terceiros, em conformidade com a LGPD.",
      "",
      "5. Esta política é preliminar e poderá ser revisada antes do uso comercial definitivo. O usuário será informado de quaisquer alterações relevantes.",
    ].join("\n"),
  },
];

/**
 * Service para seed idempotente de TermsVersion.
 *
 * Regras de idempotência:
 * - Se já existe um TermsVersion com o mesmo contentHash, não cria duplicata.
 * - Se já existe um TermsVersion ativo do mesmo type com versão igual, não cria duplicata.
 * - Apenas a versão vigente esperada fica com isActive: true.
 */
export class TermsVersionSeedService {
  /**
   * Executa o seed de um único termo. Retorna o documento existente ou recém-criado.
   * Garante idempotência por contentHash e por type+version.
   */
  async seedSingleTerm(definition: TermsSeedDefinition): Promise<{ doc: ITermsVersion; created: boolean }> {
    const contentHash = generateContentHash(definition.type, definition.version, definition.content);

    // Verifica se já existe pelo hash (conteúdo idêntico já persistido)
    const existingByHash = await termsVersionRepository.findByContentHash(contentHash);
    if (existingByHash) {
      return { doc: existingByHash, created: false };
    }

    // Verifica se já existe pelo type + version (mesma versão já registrada)
    const existingByVersion = await termsVersionRepository.findByTypeAndVersion(definition.type, definition.version);
    if (existingByVersion) {
      return { doc: existingByVersion, created: false };
    }

    // Cria o novo termo
    const doc = await termsVersionRepository.create({
      type: definition.type,
      version: definition.version,
      title: definition.title,
      content: definition.content,
      contentHash,
      effectiveFrom: definition.effectiveFrom,
      isActive: true,
    });

    return { doc, created: true };
  }

  /**
   * Executa o seed completo de todos os termos iniciais.
   * Idempotente: pode ser executado múltiplas vezes sem duplicação.
   */
  async seedAllInitialTerms(): Promise<{ results: Array<{ type: string; version: string; created: boolean }> }> {
    const results: Array<{ type: string; version: string; created: boolean }> = [];

    for (const definition of INITIAL_TERMS_DEFINITIONS) {
      const { created } = await this.seedSingleTerm(definition);
      results.push({
        type: definition.type,
        version: definition.version,
        created,
      });
    }

    return { results };
  }
}

export const termsVersionSeedService = new TermsVersionSeedService();
