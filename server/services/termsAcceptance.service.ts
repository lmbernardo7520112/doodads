import crypto from "crypto";
import { termsAcceptanceRepository } from "../repositories/termsAcceptance.repository";
import { ITermsAcceptance } from "../models/TermsAcceptance";

/**
 * Gera um hash SHA-256 de um valor sensível (IP, User-Agent).
 * Nunca persiste o valor original. Utiliza um prefixo de domínio
 * para evitar colisões entre campos diferentes.
 */
export function hashSensitiveValue(domain: string, value: string): string {
  const payload = `${domain}::${value}`;
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

/**
 * Input para criação de TermsAcceptance com snapshot.
 * Todos os dados já devem estar resolvidos antes de chamar o service.
 */
export interface CreateTermsAcceptanceInput {
  reservaId: string;
  barbeariaId: string;
  userId?: string;
  termsVersionId: string;
  acceptedAt: Date;
  checkboxLabelSnapshot: string;
  acceptanceTextSnapshot: string;
  serviceSnapshot: {
    servicoNome: string;
    priceCents: number;
    scheduledAt: Date;
    durationMinutes?: number;
    arrivalToleranceMinutes?: number;
    paymentExpirationMinutes?: number;
    cancellationWindowHours?: number;
    refundPolicySummary?: string;
    noShowPolicySummary?: string;
  };
  clientIp?: string;
  userAgent?: string;
  source: "web" | "mobile" | "admin";
  locale?: string;
}

/**
 * Erros de validação do serviço de aceite de termos.
 */
export class TermsAcceptanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TermsAcceptanceValidationError";
  }
}

/**
 * Service para criação de TermsAcceptance com snapshot de serviço e políticas.
 *
 * Responsabilidades:
 * - Validar inputs (checkboxLabel, acceptanceText não vazios, source válido).
 * - Hashear IP e User-Agent com SHA-256 (nunca persiste em texto puro).
 * - Criar documento TermsAcceptance com snapshot completo.
 *
 * Este service NÃO depende de controllers, rotas ou fluxo público.
 * Será integrado ao fluxo de reservas em fase futura.
 */
export class TermsAcceptanceService {
  /**
   * Cria um registro de aceite de termos com snapshot completo.
   * Aplica hashing em IP/User-Agent e valida inputs críticos.
   */
  async createTermsAcceptanceSnapshot(
    input: CreateTermsAcceptanceInput
  ): Promise<ITermsAcceptance> {
    // Validações de negócio
    this.validateInput(input);

    // Hash de dados sensíveis (nunca persiste em texto puro)
    const clientIpHash = input.clientIp
      ? hashSensitiveValue("client_ip", input.clientIp)
      : undefined;

    const userAgentHash = input.userAgent
      ? hashSensitiveValue("user_agent", input.userAgent)
      : undefined;

    // Monta o documento para persistência
    const docData: Partial<ITermsAcceptance> = {
      reservaId: input.reservaId as any,
      barbeariaId: input.barbeariaId as any,
      userId: input.userId ? (input.userId as any) : undefined,
      termsVersionId: input.termsVersionId as any,
      acceptedAt: input.acceptedAt,
      checkboxLabelSnapshot: input.checkboxLabelSnapshot,
      acceptanceTextSnapshot: input.acceptanceTextSnapshot,
      serviceSnapshot: {
        servicoNome: input.serviceSnapshot.servicoNome,
        priceCents: input.serviceSnapshot.priceCents,
        scheduledAt: input.serviceSnapshot.scheduledAt,
        durationMinutes: input.serviceSnapshot.durationMinutes,
        arrivalToleranceMinutes: input.serviceSnapshot.arrivalToleranceMinutes,
        paymentExpirationMinutes: input.serviceSnapshot.paymentExpirationMinutes,
        cancellationWindowHours: input.serviceSnapshot.cancellationWindowHours,
        refundPolicySummary: input.serviceSnapshot.refundPolicySummary,
        noShowPolicySummary: input.serviceSnapshot.noShowPolicySummary,
      },
      clientIpHash,
      userAgentHash,
      source: input.source,
      locale: input.locale,
    };

    return termsAcceptanceRepository.create(docData);
  }

  /**
   * Valida inputs críticos antes da persistência.
   */
  private validateInput(input: CreateTermsAcceptanceInput): void {
    if (!input.checkboxLabelSnapshot || input.checkboxLabelSnapshot.trim() === "") {
      throw new TermsAcceptanceValidationError(
        "checkboxLabelSnapshot não pode ser vazio"
      );
    }

    if (!input.acceptanceTextSnapshot || input.acceptanceTextSnapshot.trim() === "") {
      throw new TermsAcceptanceValidationError(
        "acceptanceTextSnapshot não pode ser vazio"
      );
    }

    const validSources: string[] = ["web", "mobile", "admin"];
    if (!validSources.includes(input.source)) {
      throw new TermsAcceptanceValidationError(
        `source inválido: '${input.source}'. Valores válidos: ${validSources.join(", ")}`
      );
    }

    if (!input.serviceSnapshot.servicoNome || input.serviceSnapshot.servicoNome.trim() === "") {
      throw new TermsAcceptanceValidationError(
        "serviceSnapshot.servicoNome não pode ser vazio"
      );
    }

    if (input.serviceSnapshot.priceCents < 0) {
      throw new TermsAcceptanceValidationError(
        "serviceSnapshot.priceCents não pode ser negativo"
      );
    }
  }
}

export const termsAcceptanceService = new TermsAcceptanceService();
