# 091 — Seed Cleanup e Remoção do Endpoint Legado de Pagamento Simulado — Phase E3.3 — Doodads

## 1. Objetivo
Regularizar a branch `fix/doodads-past-reservations-ux-and-cancel-hardening-phase-e3-2` incorporando a `main` para preservar a documentação DOC-P0 (PR #32), documentar a remoção do endpoint legado `pagarReservaSimulado`, a correção do seed e a limpeza de código morto associado.

## 2. Contexto

### 2.1 Risco Identificado
A branch de hardening E3-2 foi criada **antes** do merge do PR #32 (DOC-P0). O diff da branch para a `main` incluía a **deleção** de 8 arquivos de documentação governada:
- `docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md`
- `docs/payments/manual-payment-current-state.md`
- `docs/payments/payment-documentation-traceability-matrix.md`
- `docs/payments/payment-terminology-governance.md`
- `docs/payments/manual-payment-implementation-audit-governed.md`
- `docs/payments/real-pix-dynamic-payment-plan-governed.md`
- `docs/payments/drafts/auditoria_implementacao_pagamento.md`
- `docs/payments/drafts/plano_implementacao_pix_real.md`

### 2.2 Ação Executada
`git merge origin/main` incorporou os arquivos da DOC-P0 na branch sem conflitos. Verificação posterior confirmou que nenhum arquivo DOC-P0 seria deletado no diff final.

## 3. Alterações de Código

### 3.1 Seed Corrigido — `server/seed/populateDataBaseSeed.ts`
| Antes (defeito) | Depois (corrigido) |
|---|---|
| BookingPayment criado com `status: "paid"`, `paidAt: new Date()` | BookingPayment criado com `status: "pending"`, `expiresAt: +15min` |
| Reserva criada com `status: "confirmado"`, `paymentStatus: "paid"` | Reserva criada com `status: "pendente"`, `paymentStatus: "pending"` |
| Pagamento legado (Stripe `sess_abc123`) criado automaticamente | Pagamento legado removido do seed |

**Impacto**: O seed agora cria dados em estado realista que passam pelo fluxo manual para serem confirmados.

### 3.2 Reserva Fantasma Removida do Banco
- Reserva `6a4d774fdff98b80cb8650f7` removida (seed com `paid` instantâneo)
- BookingPayment `6a4d774fdff98b80cb8650f8` removido (sem metadataSafe de auditoria)
- Pagamento legado associado removido

### 3.3 Endpoint `PATCH /:id/pagar` Removido

| Arquivo | Alteração |
|---|---|
| `server/routes/reserva.routes.ts` | Rota `PATCH /:id/pagar` e import removidos |
| `server/controllers/reserva.controller.ts` | Função `pagarReservaSimulado` removida |
| `server/services/reserva.service.ts` | Método `pagarReservaSimulado` removido |
| `server/policies/reserva.policy.ts` | Método `canPay` removido |
| `server/controllers/reserva.controller.ts` | Error mappings `FORBIDDEN_PAY` e `ALREADY_PAID` removidos |
| `server/tests/reserva.routes.test.ts` | 2 test cases removidos (`/:id/pagar`) |

### 3.4 Código Morto Eliminado
- `canPay(usuarioId, reserva)` — método de policy sem chamadores
- `FORBIDDEN_PAY` — error mapping sem gerador
- `ALREADY_PAID` (do controller legado) — error mapping sem gerador

**Nota**: `ALREADY_PAID` no `bookingPaymentManual.service.ts` (L226) pertence ao fluxo manual governado e permanece ativo e válido.

## 4. Notas Documentais Adicionadas

| Report | Adendo |
|---|---|
| 059 (D1) | `"aprovado"` não é mais gerado; permanece por retrocompatibilidade |
| 060 (D1 Review) | Mesmo adendo |
| 067 (D4) | `ALREADY_PAID` pertence ao fluxo manual governado, não ao legado |
| 068 (D4 Review) | Mesmo adendo |
| 069 (D5) | Mesmo adendo |
| 070 (D5 Review) | Mesmo adendo |
| 086 (E3) | Bloqueio de `"aprovado"` é proteção retrocompatível |
| 088 (E3.2) | Referência ao report 091 para seed cleanup |

## 5. Documentos DOC-P0 Atualizados

| Documento | Atualização |
|---|---|
| `docs/payments/manual-payment-current-state.md` | Seção 4→atualizada para refletir botão "Já enviei o Pix" como IMPLEMENTADO; `manual_review` como estado ativo; Seção 5 adicionada sobre código legado removido |
| `docs/payments/payment-documentation-traceability-matrix.md` | "Já enviei o Pix" reclassificado de PLANEJADO para IMPLEMENTADO; `manual_review` de PARCIALMENTE IMPLEMENTADO para IMPLEMENTADO; nova linha para endpoint REMOVIDO |
| `docs/payments/payment-terminology-governance.md` | "Pagamento Simulado / `pagarReservaSimulado`" adicionado à tabela de termos proibidos |

## 6. Preservação DOC-P0

| Verificação | Resultado |
|---|---|
| `docs/payments/manual-payment-current-state.md` | ✅ Presente |
| `docs/payments/payment-documentation-traceability-matrix.md` | ✅ Presente |
| `docs/payments/payment-terminology-governance.md` | ✅ Presente |
| `docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md` | ✅ Presente |
| `git diff origin/main...HEAD` sem deleções em `docs/` | ✅ Confirmado |

## 7. Verificação de Remoção do Legado

| Busca | Resultado |
|---|---|
| `pagarReservaSimulado` em código ativo | ✅ Nenhuma referência |
| `PATCH /:id/pagar` em rotas | ✅ Nenhuma referência |
| `canPay` em código ativo | ✅ Nenhuma referência |
| `FORBIDDEN_PAY` em código ativo | ✅ Nenhuma referência |
| `ALREADY_PAID` no fluxo manual governado | ✅ Presente e válido (`bookingPaymentManual.service.ts`) |
| `ALREADY_PAID_CANCEL` no cancelamento | ✅ Presente e válido (proteção retrocompatível) |

## 8. Gates

| Gate | Resultado |
|---|---|
| Testes backend (`npm test`) | ✅ 23 suítes, 355 testes, 0 falhas (13.2s) |
| TypeScript (`npx tsc --noEmit`) | ✅ 0 erros |
| Build frontend (`npm run build`) | ✅ 7 rotas, todos os chunks gerados |
| Auditoria de arquivos versionados indevidos | ✅ Nenhum `node_modules/`, `.next/`, `dist/`, `.map` |
| Auditoria de .env | ✅ Nenhum `.env` versionado |
| Auditoria de secrets | ✅ `.env` apenas local; `fix-pre-e3-cancelled-booking-payments.ts` contém guard de segurança contra `mongodb+srv://` |
| Auditoria de Pix/Stripe indevidos | ✅ Apenas comentários legados desativados (`// ❌`) em `index.ts` e `api.ts` |
| Auditoria DOC-P0 final | ✅ Nenhuma deleção em `docs/payments/` ou `docs/adr/` |

## 9. Fora de Escopo Confirmado
- ❌ Pix real não implementado
- ❌ QR Code Pix não implementado
- ❌ Pix copia-e-cola não implementado
- ❌ Webhook não implementado
- ❌ Provider não escolhido
- ❌ Stripe não implementado
- ❌ Split não implementado
- ❌ Custódia não implementada
- ❌ `pagarReservaSimulado` não reintroduzido
- ❌ `canPay` não reintroduzido

## 10. Decisão

**DECISÃO: PHASE E3.3 IMPLEMENTADA COM PRESERVAÇÃO DA DOC-P0 E REMOÇÃO DO FLUXO LEGADO DE PAGAMENTO SIMULADO. A BRANCH FOI ATUALIZADA COM A MAIN ANTES DO PR, IMPEDINDO DELEÇÃO ACIDENTAL DE DOCS/PAYMENTS E DOCS/ADR. O SEED FOI CORRIGIDO PARA ESTADO REALISTA (PENDENTE/PENDING), O ENDPOINT `PATCH /:id/PAGAR` / `pagarReservaSimulado` FOI REMOVIDO, `canPay` E CÓDIGOS LEGADOS FORAM REMOVIDOS OU RECLASSIFICADOS COMO HISTÓRICOS, E OS DOCUMENTOS AFETADOS RECEBERAM ADENDOS. TESTES (23 SUÍTES / 355), TYPESCRIPT (0 ERROS), BUILD FRONTEND (7 ROTAS) E AUDITORIAS PERMANECERAM VERDES. NÃO HOUVE PIX REAL, PROVIDER, WEBHOOK, QR, STRIPE, SPLIT OU CUSTÓDIA.**

