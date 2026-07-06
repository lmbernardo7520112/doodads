# Phase D7 PR #23: Review, Merge, Post-Merge & Architecture Decision — Relatório 074

## 1. Estado Inicial do PR #23

| Campo | Valor |
|---|---|
| Número | #23 |
| Título | feat(payments): expose protected manual payment expiration route |
| Estado | OPEN → MERGED |
| Mergeable | MERGEABLE |
| Arquivos alterados | 7 |
| Adições | +812 |
| Deleções | -7 |
| Branch | `feat/doodads-manual-pix-payment-expiration-route-phase-d7` → `main` |
| URL | https://github.com/lmbernardo7520112/doodads/pull/23 |

## 2. Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `server/routes/reserva.routes.ts` | Modificado (+9: import + rota) |
| `server/controllers/bookingPaymentManual.controller.ts` | Modificado (+53: handler expirar) |
| `server/schemas/expireManualPayment.schema.ts` | Criado (27 linhas) |
| `server/services/bookingPaymentManual.service.ts` | Modificado (+44: auth/ownership) |
| `server/tests/bookingPaymentManualExpiration.service.test.ts` | Modificado (+42: userId/userTipo) |
| `server/tests/bookingPaymentManualExpiration.route.test.ts` | Criado (480 linhas, 17 testes) |
| `reports/073-manual-pix-payment-expiration-route-phase-d7-doodads.md` | Criado (156 linhas) |

---

## 3. DECISÃO ARQUITETURAL: expireOverdueManualBookingPayment como Application Service

### 3.1 Mudança de Assinatura

A interface `ExpireOverdueManualBookingPaymentInput` foi expandida de:
```typescript
{ bookingPaymentId: string }
```
para:
```typescript
{ bookingPaymentId: string; userId: string; userTipo: "admin" | "barbeiro" | "cliente" }
```

Esta mudança é **intencional e deliberada**.

### 3.2 Classificação: Domain Service → Application Service

| Aspecto | Phase D6 (antes) | Phase D7 (depois) |
|---|---|---|
| Assinatura | apenas bookingPaymentId | bookingPaymentId + userId + userTipo |
| Responsabilidade | Regra de domínio pura | Regra de domínio + autorização/ownership |
| Classificação | Domain Service | Application Service |
| Acoplamento a identidade | Nenhum | Depende de userId/userTipo |
| Chamável sem contexto HTTP | Sim (qualquer caller) | Requer identidade do chamador |

### 3.3 Justificativa

A centralização de autorização/ownership no service (e não no controller):

1. **Evita bypass**: Qualquer futuro caller (batch, admin CLI, outro service) é forçado a fornecer userId/userTipo e passar pelas mesmas regras de segurança.
2. **Controller permanece fino**: O controller apenas extrai userId/tipo do JWT e delega ao service.
3. **Consistência com confirmManualBookingPayment**: Ambos os métodos de ação (confirmar e expirar) seguem o mesmo padrão: application service com auth centralizada.

### 3.4 Ressalva Formal

O método **não é mais uma função de domínio pura**. Ele agora combina:
- Validação de domínio (provider, status, expiresAt, consistência Reserva)
- Autorização de aplicação (tipo de usuário, ownership de barbearia)

Se futuramente for necessário separar essas responsabilidades (ex.: um cron/job que precisa expirar sem contexto de usuário), será preciso:
- Extrair a regra de domínio pura para um método interno privado
- Criar um novo caller com ADR própria que documente por que não precisa de auth

### 3.5 Recomendação: ADR Futura

> [!IMPORTANT]
> **Antes de expandir novos recursos do módulo de pagamentos manuais** (cancelamento, reembolso, Pix real, provider, webhook, cron), recomenda-se criar uma ADR curta de fronteira arquitetural que:
> - Defina quais métodos são domain services puros e quais são application services
> - Documente se auth deve permanecer centralizada no service ou ser extraída para middleware
> - Avalie se o `BookingPaymentManualService` deve ser dividido em camadas
> - Registre restrições para futuros cron/job/scheduler (não reaproveitar a rota administrativa cegamente)

### 3.6 Regra para Cron/Job Futuro

Se futuramente um cron/job/scheduler for criado para expiração automática:
1. **Não deve reaproveitar a rota administrativa** (`PATCH .../expirar`).
2. **Não deve chamar `expireOverdueManualBookingPayment`** diretamente (pois exige userId/userTipo de humano).
3. **Deve criar fase/ADR própria** que defina:
   - Quem é o "usuário" do sistema automatizado
   - Como auditar ações automáticas vs. manuais
   - Limites de batch processing

---

## 4. Análise da Rota

```typescript
router.patch(
  "/pagamento-manual/:bookingPaymentId/expirar",
  authMiddleware,              // JWT obrigatório
  validateRequest(expireManualPaymentSchema),  // Zod .strict()
  expirarPagamentoManual       // Controller fino
);
```

- Método: PATCH ✅
- Path: `/api/reservas/pagamento-manual/:bookingPaymentId/expirar` ✅
- authMiddleware: aplicado ✅
- validateRequest: aplicado ✅
- Controller correto: `expirarPagamentoManual` ✅
- Sem lógica financeira na rota: ✅

## 5. Análise do Controller

`expirarPagamentoManual` (L81-125):
- Controller fino: extract → delegate → respond ✅
- Extrai userId/tipo de req.user via `getUserInfo` ✅
- Delega ao service `expireOverdueManualBookingPayment` ✅
- Não confia em body para campos server-owned ✅
- Response whitelist: id, status, expiresAt, amountCents, currency, provider ✅
- Usa `presentPaymentStatus` e `presentReservaStatus` ✅
- Não retorna Pix, QR, webhook, copia-e-cola, provider real ou dados sensíveis ✅

## 6. Análise do Schema

`expireManualPaymentSchema`:
- Zod `.strict()` em params e body ✅
- bookingPaymentId: hex24 regex ✅
- body: apenas expirationNote opcional (max 500) ✅
- status/paymentStatus/paidAt/amountCents/provider/pixKey/webhook/qr/token/secret rejeitados ✅

## 7. Análise de Autenticação

- authMiddleware exige JWT → 401 sem token ✅
- Controller verifica userId/userTipo → 401 se ausente ✅

## 8. Análise de Autorização/Ownership

- Cliente → 403 `CLIENT_CANNOT_EXPIRE_PAYMENT` (service L339-344) ✅
- userTipo desconhecido → 403 `UNAUTHORIZED_EXPIRE_PAYMENT` (service L347-352) ✅
- Barbeiro sem ownership → 403 `OWNERSHIP_MISMATCH` (service L410-418) ✅
- Barbeiro proprietário → expira ✅
- Admin → expira qualquer barbearia (service L420) ✅

## 9. Análise da Regra de Expiração

| Validação | Linha | Código |
|---|---|---|
| ObjectId válido | L334 | `INVALID_BOOKING_PAYMENT_ID` |
| BookingPayment existe | L357 | `BOOKING_PAYMENT_NOT_FOUND` |
| Provider = manual | L362 | `PROVIDER_NOT_MANUAL` |
| Status = pending | L371 | codeMap |
| expiresAt definido | L388 | `NO_EXPIRES_AT` |
| expiresAt no passado | L396 | `NOT_YET_EXPIRED` |
| Barbearia existe | L406 | `BARBEARIA_NOT_FOUND` |
| Ownership | L410 | `OWNERSHIP_MISMATCH` |
| Reserva existe | L423 | `RESERVA_NOT_FOUND` |
| paymentRequired | L433 | `RESERVA_PAYMENT_NOT_REQUIRED` |
| bookingPaymentId corresponde | L441 | `BOOKING_PAYMENT_MISMATCH` |

## 10. Análise do Response

```json
{
  "message": "Pagamento expirado com sucesso.",
  "bookingPayment": { "id", "status", "expiresAt", "amountCents", "currency", "provider" },
  "reserva": { "id", "status", "paymentStatus" },
  "paymentStatusPresentation": { "code", "label", "description", "tone" },
  "reservaStatusPresentation": { "code", "label", "description", "tone" }
}
```

- Conservador ✅
- Sem enums crus expostos ✅
- Labels PT-BR via presenter ✅
- Sem Pix/QR/webhook/provider real ✅
- Sem dados sensíveis ✅

## 11. Análise de Preservação de Reserva.status

Service L470-472:
```typescript
reserva.paymentStatus = "expired";
// Nota: status principal da Reserva preservado (sem alteração indevida).
```

Nenhuma atribuição a `reserva.status` no método. Status principal preservado. ✅

## 12. Ausências Confirmadas

| Verificação | Resultado |
|---|---|
| Frontend alterado | ❌ Ausente ✅ |
| Cron/Job/Scheduler/Worker | ❌ Ausente ✅ |
| Pix real | ❌ Ausente ✅ |
| QR real | ❌ Ausente ✅ |
| Webhook | ❌ Ausente ✅ |
| Provider real | ❌ Ausente ✅ |
| Chamada automática ao expireOverdueManualBookingPayment | ❌ Ausente ✅ |

### Uso do método (confirmado)
- Definição: `bookingPaymentManual.service.ts:328`
- Controller: `bookingPaymentManual.controller.ts:91`
- Testes: `bookingPaymentManualExpiration.service.test.ts` + `bookingPaymentManualExpiration.route.test.ts`
- Nenhum outro caller.

## 13. Testes Executados

### Pré-merge (na branch)
```
Test Suites: 18 passed, 18 total
Tests:       312 passed, 312 total
```

### Pós-merge (na main)
```
Test Suites: 18 passed, 18 total
Tests:       312 passed, 312 total
```

### TypeScript
```
npx tsc --noEmit → 0 erros (pré e pós-merge)
```

### Testes de rota — 17 testes
| # | Teste | Status |
|---|---|---|
| 1 | Barbeiro proprietário expira — 200 | ✅ |
| 2 | Admin expira — 200 | ✅ |
| 3 | Cliente → 403 | ✅ |
| 4 | Barbeiro outra barbearia → 403 | ✅ |
| 5 | Sem token → 401 | ✅ |
| 6 | Pagamento não vencido → 409 | ✅ |
| 7 | Paid → 409 | ✅ |
| 8 | Manual_review → 409 | ✅ |
| 9 | Provider não-manual → 400 | ✅ |
| 10 | Mass assignment (corpo completo) → 400 | ✅ |
| 11 | Mass assignment (apenas status) → 400 | ✅ |
| 12 | Response com labels PT-BR | ✅ |
| 13 | Response sem Pix/QR/webhook | ✅ |
| 14 | Ausência de frontend | ✅ |
| 15 | bookingPaymentId inválido → 400 | ✅ |
| 16 | Body vazio aceito | ✅ |
| 17 | Reserva.status preservado | ✅ |

## 14. Auditorias

| Auditoria | Pré-merge | Pós-merge |
|---|---|---|
| Artifacts | ✅ Limpo | ✅ Limpo |
| .env | ✅ Limpo | ✅ Limpo |
| Secrets | ✅ Limpo | ✅ Limpo |
| Pix/QR/Webhook | ✅ Limpo | ✅ Limpo |
| Cron/Job/Scheduler | ✅ Limpo | ✅ Limpo |
| Frontend | ✅ Limpo | ✅ Limpo |

## 15. Hash do Merge

```
c2ff9d3 feat(payments): expose protected manual payment expiration route (#23)
```

## 16. Decisão GO/NO-GO

| Critério | Status |
|---|---|
| Testes verdes (100%) | ✅ 312/312 |
| TypeScript 0 erros | ✅ |
| Auditorias limpas | ✅ |
| Rota PATCH protegida | ✅ |
| Controller fino | ✅ |
| Schema Zod .strict() | ✅ |
| Autenticação JWT | ✅ |
| Autorização/ownership no service | ✅ |
| Bloqueio de cliente | ✅ |
| Mass assignment rejeitado | ✅ |
| Response conservador | ✅ |
| Presenter PT-BR | ✅ |
| Reserva.status preservado | ✅ |
| Expiração manual, não automática | ✅ |
| Sem frontend | ✅ |
| Sem cron/job/scheduler | ✅ |
| Sem Pix real/QR/webhook/provider | ✅ |
| Decisão arquitetural documentada | ✅ |
| Recomendação de ADR documentada | ✅ |

## 17. Decisão

**DECISÃO: PR #23 REVISADO, MERGEADO E VALIDADO. ROTA/CONTROLLER BACKEND-ONLY PROTEGIDO PARA EXPIRAÇÃO MANUAL/ADMINISTRATIVA DE PAGAMENTO VENCIDO FOI INTEGRADO COM AUTENTICAÇÃO, AUTORIZAÇÃO/OWNERSHIP, BLOQUEIO DE CLIENTE, PROTEÇÃO CONTRA MASS ASSIGNMENT, RESPONSE CONSERVADOR COM LABELS PT-BR E EXPIRAÇÃO NÃO AUTOMÁTICA, SEM FRONTEND, SEM CRON/JOB/SCHEDULER, SEM PIX REAL, QR REAL, WEBHOOK OU PROVIDER REAL. A MUDANÇA DE expireOverdueManualBookingPayment PARA APPLICATION SERVICE COM userId/userTipo FOI FORMALMENTE DOCUMENTADA COMO DECISÃO ARQUITETURAL DE SEGURANÇA, COM RECOMENDAÇÃO DE ADR ANTES DE NOVAS EXPANSÕES DO MÓDULO DE PAGAMENTOS. TESTES (312 EM 18 SUÍTES), TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
