# Phase D6: Service Backend-Only de Expiração Controlada de BookingPayment Manual — Relatório 071

## 1. Objetivo

Implementar service/repository backend-only para expiração controlada de BookingPayment manual pending vencido, sem criar rota, sem frontend, sem cron/job automático, sem Pix real, sem QR, sem webhook e sem provider real. Regra de domínio pura testada para transição pending vencido → expired e atualização consistente da Reserva associada.

## 2. Arquivos Alterados/Criados

| Arquivo | Ação |
|---|---|
| `server/services/bookingPaymentManual.service.ts` | Modificado (+139 linhas) |
| `server/tests/bookingPaymentManualExpiration.service.test.ts` | Criado (21 testes) |
| `reports/071-manual-pix-payment-expiration-service-phase-d6-doodads.md` | Criado |

## 3. Regra de Expiração

Método: `expireOverdueManualBookingPayment(input)` na classe `BookingPaymentManualService`.

### Pré-condições obrigatórias

| # | Condição | Erro se violada |
|---|---|---|
| 1 | bookingPaymentId válido (ObjectId) | 400 `INVALID_BOOKING_PAYMENT_ID` |
| 2 | BookingPayment existente | 404 `BOOKING_PAYMENT_NOT_FOUND` |
| 3 | provider = `manual` | 400 `PROVIDER_NOT_MANUAL` |
| 4 | status = `pending` | 409 (código específico por status) |
| 5 | expiresAt definido | 400 `NO_EXPIRES_AT` |
| 6 | expiresAt no passado | 409 `NOT_YET_EXPIRED` |
| 7 | Reserva associada existente | 404 `RESERVA_NOT_FOUND` |
| 8 | Reserva.paymentRequired = true | 409 `RESERVA_PAYMENT_NOT_REQUIRED` |
| 9 | Reserva.bookingPaymentId correspondente | 409 `BOOKING_PAYMENT_MISMATCH` |

### Bloqueio por status não-pending

| Status atual | Código de erro | HTTP |
|---|---|---|
| paid | `CANNOT_EXPIRE_PAID` | 409 |
| expired | `ALREADY_EXPIRED` | 409 |
| cancelled | `CANNOT_EXPIRE_CANCELLED` | 409 |
| refunded | `CANNOT_EXPIRE_REFUNDED` | 409 |
| failed | `CANNOT_EXPIRE_FAILED` | 409 |
| manual_review | `CANNOT_EXPIRE_MANUAL_REVIEW` | 409 |

## 4. Transição BookingPayment pending vencido → expired

- BookingPayment.status: `pending` → `expired`
- BookingPayment.metadataSafe: `{ expiredAt, expirationReason: "overdue_manual_payment" }`
- BookingPayment.expiresAt: preservado (sem alteração)

## 5. Atualização de Reserva

- Reserva.paymentStatus: `pending` → `expired`
- Reserva.status principal: **preservado** como `"pendente"` (sem alteração indevida)
- Decisão sobre cancelamento automático da reserva será em fase futura

## 6. Confirmações de Ausência

| Verificação | Resultado |
|---|---|
| Rota nova | ❌ Ausente ✅ |
| Controller novo | ❌ Ausente ✅ |
| Frontend alterado | ❌ Ausente ✅ |
| Cron/job/scheduler | ❌ Ausente ✅ |
| Pix real | ❌ Ausente ✅ |
| QR real | ❌ Ausente ✅ |
| Webhook | ❌ Ausente ✅ |
| Provider real | ❌ Ausente ✅ |

## 7. Testes Criados

21 testes em 1 nova suíte: `bookingPaymentManualExpiration.service.test.ts`

| # | Teste | Status |
|---|---|---|
| 1 | Expiração válida pending vencido → expired | ✅ |
| 2 | Reserva.paymentStatus → expired | ✅ |
| 3 | Status principal da Reserva preservado | ✅ |
| 4 | Pending não vencido → NOT_YET_EXPIRED | ✅ |
| 5 | Paid → CANNOT_EXPIRE_PAID | ✅ |
| 6 | Cancelled → CANNOT_EXPIRE_CANCELLED | ✅ |
| 7 | Refunded → CANNOT_EXPIRE_REFUNDED | ✅ |
| 8 | Failed → CANNOT_EXPIRE_FAILED | ✅ |
| 9 | Manual_review → CANNOT_EXPIRE_MANUAL_REVIEW | ✅ |
| 10 | Already expired → ALREADY_EXPIRED | ✅ |
| 11 | Provider não-manual → PROVIDER_NOT_MANUAL | ✅ |
| 12 | Reserva divergente → BOOKING_PAYMENT_MISMATCH | ✅ |
| 13 | Reserva sem paymentRequired → RESERVA_PAYMENT_NOT_REQUIRED | ✅ |
| 14 | Sem expiresAt → NO_EXPIRES_AT | ✅ |
| 15 | Metadata audit trail (expiredAt, reason) | ✅ |
| 16 | expiresAt preservado | ✅ |
| 17 | bookingPaymentId inválido → 400 | ✅ |
| 18 | BookingPayment inexistente → 404 | ✅ |
| 19 | Ausência de cron/job/scheduler | ✅ |
| 20 | Ausência de Pix/QR/webhook/provider | ✅ |
| 21 | Verificação no banco pós-expiração | ✅ |

## 8. Comandos Executados

```bash
git checkout main && git pull origin main
git checkout -b feat/doodads-manual-pix-payment-expiration-service-phase-d6

cd server && npx tsc --noEmit   # 0 erros
cd server && npm run test       # 17 suítes, 294 testes verdes

git ls-files | grep -E '...(artifacts)...' || true  # limpo
git ls-files | grep -E '...(env)...' || true         # apenas config/env.ts
grep -RIn ... 'secrets' . || true                    # limpo
git diff --name-only main...HEAD | grep -E 'client/|routes/|controllers/|cron|job' || true  # limpo
git diff main...HEAD -- server | grep -E 'pixQr|webhook|...' || true  # limpo
```

## 9. Resultado Real dos Testes

```
Test Suites: 17 passed, 17 total
Tests:       294 passed, 294 total
Snapshots:   0 total
```

## 10. Resultado Real do TypeScript

```
npx tsc --noEmit → 0 erros
```

## 11. Auditorias

| Auditoria | Resultado |
|---|---|
| Artifacts | ✅ Limpo |
| .env | ✅ Limpo (apenas config/env.ts) |
| Secrets | ✅ Limpo |
| Rota/Controller/Frontend/Cron | ✅ Limpo |
| Pix/QR/Webhook/Provider | ✅ Limpo |

## 12. Decisão GO/NO-GO

| Critério | Status |
|---|---|
| Testes verdes (100%) | ✅ 294/294 |
| TypeScript 0 erros | ✅ |
| Auditorias limpas | ✅ |
| Expiração pending vencido → expired | ✅ |
| Reserva.paymentStatus → expired | ✅ |
| Reserva.status preservado | ✅ |
| Bloqueio de status não-pending | ✅ 6/6 |
| Bloqueio de provider não-manual | ✅ |
| Bloqueio de pagamento não vencido | ✅ |
| Sem rota/controller | ✅ |
| Sem frontend | ✅ |
| Sem cron/job/scheduler | ✅ |
| Sem Pix real | ✅ |
| Sem QR | ✅ |
| Sem webhook | ✅ |
| Sem provider real | ✅ |

## 13. Decisão

**DECISÃO: PHASE D6 IMPLEMENTADA COM SERVICE BACKEND-ONLY DE EXPIRAÇÃO CONTROLADA DE BOOKINGPAYMENT MANUAL PENDING VENCIDO, TRANSIÇÃO PENDING → EXPIRED, ATUALIZAÇÃO CONSISTENTE DE RESERVA, PRESERVAÇÃO DO STATUS PRINCIPAL DA RESERVA, SEM FRONTEND, SEM ROTAS, SEM CONTROLLERS, SEM CRON/JOB, SEM PIX REAL, QR REAL, WEBHOOK OU PROVIDER REAL. TESTES (294 EM 17 SUÍTES), TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
