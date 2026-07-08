# Phase D1: Campos Opcionais de Pagamento em Reserva — Relatório 059

## 1. Objetivo

Preparar o model Reserva para suportar futuramente o fluxo manual_pix controlado, adicionando campos opcionais de pagamento/aceite com defaults seguros, sem ativar payment_pending no fluxo, sem alterar services/controllers/routes/schemas e sem Pix real.

## 2. Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `server/models/Reserva.ts` | Modificado — campos opcionais adicionados |
| `server/tests/reservaPaymentFields.model.test.ts` | Criado — 35 testes |

## 3. Campos Adicionados em Reserva

| Campo | Tipo | Default | Server-Owned | Obrigatório |
|---|---|---|---|---|
| `paymentRequired` | Boolean | `false` | ✅ | Não |
| `bookingPaymentId` | ObjectId ref BookingPayment | undefined | ✅ | Não |
| `termsAcceptanceId` | ObjectId ref TermsAcceptance | undefined | ✅ | Não |
| `paymentExpiresAt` | Date | undefined | ✅ | Não |
| `confirmedAt` | Date | undefined | ✅ | Não |
| `noShowMarkedAt` | Date | undefined | ✅ | Não |
| `noShowMarkedBy` | ObjectId ref User | undefined | ✅ | Não |
| `cancelledAt` | Date | undefined | ✅ | Não |
| `completedAt` | Date | undefined | ✅ | Não |

## 4. Enum paymentStatus

### Valores Legados (mantidos para retrocompatibilidade)
- `pendente` (default)
- `aprovado`
- `falhou`

### Valores Novos (para manual_pix futuro)
- `not_required`
- `pending`
- `paid`
- `expired`
- `refunded`
- `failed`
- `manual_review`

## 5. Status Principal de Reserva — NÃO Alterado

| Decisão | Justificativa |
|---|---|
| **Enum de status NÃO foi ampliado** | A spec D0 prevê `payment_pending` e `expired` no enum principal em fase futura. Nesta fase D1, apenas os campos opcionais foram adicionados. O campo `paymentStatus` separado é suficiente para rastrear estado de pagamento sem alterar o fluxo principal. Isso preserva retrocompatibilidade absoluta: nenhum service, controller ou route precisa ser alterado. |
| **Impacto zero** | Testes confirmam que `payment_pending`, `expired`, `no_show` e `manual_review` são rejeitados no enum de status principal. |

## 6. Estratégia de Retrocompatibilidade

1. Todos os campos novos são opcionais ou têm default seguro.
2. `paymentRequired: false` por default → reservas antigas não são afetadas.
3. `paymentStatus` default permanece `"pendente"` (legado).
4. Enum de status principal intacto: `["pendente", "confirmado", "cancelado", "finalizado"]`.
5. Nenhum service, controller, route ou schema Zod foi alterado.

## 7. Testes Criados (35)

| Grupo | # | Validação |
|---|---|---|
| Retrocompatibilidade | 4 | Reserva antiga, status padrão, paymentStatus legado |
| Defaults D1 | 9 | paymentRequired false, todos campos undefined |
| Novos paymentStatus | 7 | Cada novo valor aceito |
| Rejeição inválidos | 3 | paymentStatus inválido, status principal inválido |
| ObjectId refs | 3 | bookingPaymentId, termsAcceptanceId, noShowMarkedBy |
| Date fields | 4 | paymentExpiresAt, confirmedAt, cancelledAt, completedAt |
| paymentRequired | 2 | true, false explícito |
| Ausência funcional | 3 | Enum principal intacto, paymentStatus enum completo, fluxo antigo |

## 8. Resultados

```
Test Suites: 11 passed, 11 total
Tests:       181 passed, 181 total
TypeScript:  0 erros
```

## 9. Auditorias

| Auditoria | Resultado |
|---|---|
| Artifacts | ✅ Limpo |
| .env | ✅ Apenas env.ts |
| Secrets | ✅ Limpo |
| Escopo funcional | ✅ Sem routes/controllers/services/schemas |
| Ativação funcional | ✅ Sem pixQr/webhook/provider/confirmarPagamento |

## 10. Decisão

**DECISÃO: PHASE D1 IMPLEMENTADA COM 9 CAMPOS OPCIONAIS E RETROCOMPATÍVEIS DE PAGAMENTO/ACEITE EM RESERVA, ENUM PAYMENTSTATUS EXPANDIDO COM 10 VALORES (3 LEGADOS + 7 NOVOS), STATUS PRINCIPAL NÃO ALTERADO, 35 TESTES DEDICADOS, SEM ATIVAÇÃO FUNCIONAL DE MANUAL_PIX, SEM SERVICE/CONTROLLER/ROUTE/SCHEMA/FRONTEND, SEM PAYMENT_PENDING ATIVO NO FLUXO, SEM PIX REAL, WEBHOOK, QR REAL OU PROVIDER REAL. SUÍTE COMPLETA: 11 SUÍTES, 181 TESTES VERDES, TYPESCRIPT 0 ERROS, AUDITORIAS LIMPAS.**


---

> **Adendo Phase E3.3 (2026-07-07):** O endpoint legado `PATCH /:id/pagar` (`pagarReservaSimulado`), que era o único gerador do valor `paymentStatus: "aprovado"`, foi removido. O valor `"aprovado"` permanece no enum do modelo `Reserva` exclusivamente para retrocompatibilidade de dados persistidos anteriormente, mas não é mais gerado por nenhum endpoint ativo. Todo fluxo de pagamento ativo utiliza `"paid"` via confirmação manual pelo barbeiro.
