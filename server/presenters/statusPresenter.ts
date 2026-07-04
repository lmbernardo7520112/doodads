/**
 * Presenter/Mapper de status internos para labels PT-BR.
 *
 * Enums de paymentStatus e status de Reserva são códigos técnicos internos
 * que NÃO devem ser exibidos crus ao usuário final. Este módulo traduz
 * cada código para um objeto estável com label, descrição e tom visual.
 *
 * Decisão formal (Report 060): enums internos devem passar por este
 * mapper/presenter antes de qualquer UI ou API pública de pagamento.
 */

// =====================================================
// Tipos
// =====================================================

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusPresentation {
  /** Código técnico original (enum interno) */
  code: string;
  /** Label legível em PT-BR para exibição ao usuário */
  label: string;
  /** Descrição curta em PT-BR */
  description: string;
  /** Tom visual sem acoplamento a UI específica */
  tone: StatusTone;
}

// =====================================================
// paymentStatus — 10 valores (3 legados PT + 7 novos EN)
// =====================================================

const PAYMENT_STATUS_MAP: Record<string, StatusPresentation> = {
  // Legados (retrocompatibilidade Stripe)
  pendente: {
    code: "pendente",
    label: "Pagamento pendente",
    description: "Aguardando processamento do pagamento.",
    tone: "warning",
  },
  aprovado: {
    code: "aprovado",
    label: "Pagamento aprovado",
    description: "Pagamento confirmado com sucesso.",
    tone: "success",
  },
  falhou: {
    code: "falhou",
    label: "Pagamento falhou",
    description: "O pagamento não pôde ser processado.",
    tone: "danger",
  },

  // Novos (manual_pix D1)
  not_required: {
    code: "not_required",
    label: "Pagamento não exigido",
    description: "Esta reserva não exige pagamento antecipado.",
    tone: "neutral",
  },
  pending: {
    code: "pending",
    label: "Pagamento pendente",
    description: "Aguardando confirmação do pagamento pela barbearia.",
    tone: "warning",
  },
  paid: {
    code: "paid",
    label: "Pagamento confirmado",
    description: "Pagamento recebido e confirmado pela barbearia.",
    tone: "success",
  },
  expired: {
    code: "expired",
    label: "Pagamento expirado",
    description: "O prazo para pagamento expirou.",
    tone: "danger",
  },
  refunded: {
    code: "refunded",
    label: "Reembolsado",
    description: "O valor foi devolvido ao cliente.",
    tone: "info",
  },
  failed: {
    code: "failed",
    label: "Pagamento falhou",
    description: "Ocorreu uma falha no processamento do pagamento.",
    tone: "danger",
  },
  manual_review: {
    code: "manual_review",
    label: "Em análise manual",
    description: "Pagamento encaminhado para análise pela barbearia ou administrador.",
    tone: "warning",
  },
};

// =====================================================
// status principal da Reserva — 4 valores
// =====================================================

const RESERVA_STATUS_MAP: Record<string, StatusPresentation> = {
  pendente: {
    code: "pendente",
    label: "Pendente",
    description: "Reserva aguardando confirmação.",
    tone: "warning",
  },
  confirmado: {
    code: "confirmado",
    label: "Confirmada",
    description: "Reserva confirmada.",
    tone: "success",
  },
  cancelado: {
    code: "cancelado",
    label: "Cancelada",
    description: "Reserva cancelada.",
    tone: "danger",
  },
  finalizado: {
    code: "finalizado",
    label: "Finalizada",
    description: "Serviço concluído.",
    tone: "success",
  },
};

// =====================================================
// Fallback para status desconhecido
// =====================================================

function unknownStatus(code: string, domain: string): StatusPresentation {
  return {
    code,
    label: "Status desconhecido",
    description: `Status "${code}" não reconhecido em ${domain}.`,
    tone: "neutral",
  };
}

// =====================================================
// API pública
// =====================================================

/**
 * Traduz um paymentStatus técnico para label PT-BR.
 * Retorna fallback seguro para status desconhecido (nunca expõe enum cru).
 */
export function presentPaymentStatus(code: string): StatusPresentation {
  return PAYMENT_STATUS_MAP[code] ?? unknownStatus(code, "paymentStatus");
}

/**
 * Traduz um status de Reserva para label PT-BR.
 * Retorna fallback seguro para status desconhecido (nunca expõe enum cru).
 */
export function presentReservaStatus(code: string): StatusPresentation {
  return RESERVA_STATUS_MAP[code] ?? unknownStatus(code, "reservaStatus");
}

/**
 * Retorna todos os paymentStatus conhecidos e suas apresentações.
 * Útil para documentação, debugging e testes.
 */
export function allPaymentStatuses(): StatusPresentation[] {
  return Object.values(PAYMENT_STATUS_MAP);
}

/**
 * Retorna todos os status de Reserva conhecidos e suas apresentações.
 */
export function allReservaStatuses(): StatusPresentation[] {
  return Object.values(RESERVA_STATUS_MAP);
}
