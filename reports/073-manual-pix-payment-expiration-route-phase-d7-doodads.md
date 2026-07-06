# Phase D7: Rota/Controller Backend-Only para Expiração Manual de Pagamento Vencido — Relatório 073

## 1. Objetivo

Expor a expiração controlada de pagamento manual vencido por uma rota/controller backend-only protegida, reutilizando o service `expireOverdueManualBookingPayment` já implementado. Apenas barbeiro proprietário ou admin. Sem cron/job/scheduler, sem frontend, sem Pix real.

## 2. Arquivos Alterados/Criados

| Arquivo | Ação |
|---|---|
| `server/routes/reserva.routes.ts` | Modificado (+9 linhas: import + rota) |
| `server/controllers/bookingPaymentManual.controller.ts` | Modificado (+53 linhas: handler expirar) |
| `server/schemas/expireManualPayment.schema.ts` | Criado (27 linhas) |
| `server/services/bookingPaymentManual.service.ts` | Modificado (auth/ownership na expiração) |
| `server/tests/bookingPaymentManualExpiration.service.test.ts` | Modificado (userId/userTipo em todas as chamadas) |
| `server/tests/bookingPaymentManualExpiration.route.test.ts` | Criado (17 testes) |
| `reports/073-manual-pix-payment-expiration-route-phase-d7-doodads.md` | Criado |

## 3. Rota Criada

**Rota**: `PATCH /api/reservas/pagamento-manual/:bookingPaymentId/expirar`

```typescript
router.patch(
  "/pagamento-manual/:bookingPaymentId/expirar",
  authMiddleware,
  validateRequest(expireManualPaymentSchema),
  expirarPagamentoManual
);
```

## 4. Controller

Handler `expirarPagamentoManual` — controller fino:
- Extrai userId/tipo do req.user
- Delega ao service `expireOverdueManualBookingPayment`
- Response whitelist: id, status, expiresAt, amountCents, currency, provider
- Apresenta paymentStatusPresentation e reservaStatusPresentation em PT-BR

## 5. Schema

`expireManualPayment.schema.ts` — Zod `.strict()`:
- params: bookingPaymentId (hex24)
- body: expirationNote (opcional, max 500)
- .strict() rejeita campos extras

## 6. Autenticação

- authMiddleware (JWT) → 401 sem token

## 7. Autorização/Ownership

- Cliente → 403 `CLIENT_CANNOT_EXPIRE_PAYMENT`
- Barbeiro sem ownership → 403 `OWNERSHIP_MISMATCH`
- Barbeiro proprietário → expiração
- Admin → expiração qualquer barbearia

## 8. Mass Assignment

Schema .strict() rejeita status, paymentStatus, expiresAt, amountCents, provider, pixKey, webhook e qualquer campo extra.

## 9. Response

```json
{
  "message": "Pagamento expirado com sucesso.",
  "bookingPayment": { "id", "status", "expiresAt", "amountCents", "currency", "provider" },
  "reserva": { "id", "status", "paymentStatus" },
  "paymentStatusPresentation": { "code", "label", "description", "tone" },
  "reservaStatusPresentation": { "code", "label", "description", "tone" }
}
```

## 10. Ausências Confirmadas

| Verificação | Resultado |
|---|---|
| Frontend | ❌ Ausente ✅ |
| Cron/Job/Scheduler | ❌ Ausente ✅ |
| Pix real | ❌ Ausente ✅ |
| QR real | ❌ Ausente ✅ |
| Webhook | ❌ Ausente ✅ |
| Provider real | ❌ Ausente ✅ |

## 11. Testes Criados

### Route tests — 17 testes
| # | Teste | Status |
|---|---|---|
| 1 | Barbeiro proprietário expira — 200 | ✅ |
| 2 | Admin expira — 200 | ✅ |
| 3 | Cliente → 403 | ✅ |
| 4 | Barbeiro outra barbearia → 403 | ✅ |
| 5 | Sem token → 401 | ✅ |
| 6 | Pagamento não vencido → 409 NOT_YET_EXPIRED | ✅ |
| 7 | Paid → 409 CANNOT_EXPIRE_PAID | ✅ |
| 8 | Manual_review → 409 CANNOT_EXPIRE_MANUAL_REVIEW | ✅ |
| 9 | Provider não-manual → 400 | ✅ |
| 10 | Body server-owned → 400 | ✅ |
| 11 | Body apenas status → 400 | ✅ |
| 12 | Response PT-BR | ✅ |
| 13 | Response sem Pix/QR/webhook | ✅ |
| 14 | Sem dependência de frontend | ✅ |
| 15 | bookingPaymentId inválido → 400 | ✅ |
| 16 | Body vazio aceito | ✅ |
| 17 | Reserva.status preservado | ✅ |

### Service tests updated — 21 testes (userId/userTipo adicionado)

## 12. Resultado Real dos Testes

```
Test Suites: 18 passed, 18 total
Tests:       312 passed, 312 total
Snapshots:   0 total
```

## 13. Resultado Real do TypeScript

```
npx tsc --noEmit → 0 erros
```

## 14. Auditorias

| Auditoria | Resultado |
|---|---|
| Artifacts | ✅ Limpo |
| .env | ✅ Limpo (apenas config/env.ts) |
| Secrets | ✅ Limpo |
| Pix/QR/Webhook | ✅ Limpo |
| Cron/Job/Scheduler | ✅ Limpo |
| Frontend | ✅ Limpo |

## 15. Decisão GO/NO-GO

| Critério | Status |
|---|---|
| Testes verdes (100%) | ✅ 312/312 |
| TypeScript 0 erros | ✅ |
| Auditorias limpas | ✅ |
| Autenticação JWT | ✅ |
| Autorização/ownership | ✅ |
| Bloqueio de cliente | ✅ |
| Mass assignment bloqueado | ✅ |
| Presenter PT-BR | ✅ |
| Sem frontend | ✅ |
| Sem cron/job/scheduler | ✅ |
| Sem Pix real | ✅ |
| Sem QR | ✅ |
| Sem webhook | ✅ |
| Sem provider real | ✅ |

## 16. Decisão

**DECISÃO: PHASE D7 IMPLEMENTADA COM ROTA/CONTROLLER BACKEND-ONLY PROTEGIDO PARA EXPIRAÇÃO MANUAL/ADMINISTRATIVA DE PAGAMENTO VENCIDO, AUTENTICAÇÃO, AUTORIZAÇÃO/OWNERSHIP, BLOQUEIO DE CLIENTE, PROTEÇÃO CONTRA MASS ASSIGNMENT E RESPONSE CONSERVADOR COM LABELS PT-BR, SEM FRONTEND, SEM CRON/JOB/SCHEDULER, SEM PIX REAL, QR REAL, WEBHOOK OU PROVIDER REAL. TESTES (312 EM 18 SUÍTES), TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
