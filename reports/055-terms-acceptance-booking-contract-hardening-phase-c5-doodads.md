# Phase C5: Contract Hardening — acceptedTerms na Criação de Reserva — Relatório 055

## 1. Objetivo

Fortalecer o contrato de entrada HTTP/Zod da criação de reservas para aceitar `acceptedTerms` de forma explícita, restrita e segura, preservando retrocompatibilidade e impedindo mass assignment via `.strict()`.

## 2. Arquivos Alterados

| Arquivo | Tipo | Alteração |
|---|---|---|
| `server/schemas/reserva.schema.ts` | Modificado | Adição de `acceptedTermsSchema` como sub-schema `.strict()` opcional no body |
| `server/tests/reservaContractHardening.schema.test.ts` | Criado | 41 testes de contrato/validação |

**Nenhum arquivo em `client/`, `server/routes/`, `server/controllers/`, `server/models/Reserva.ts` ou `server/services/` foi alterado.**

## 3. Contrato acceptedTerms Formalizado

### Schema Zod:

```typescript
const acceptedTermsSchema = z.object({
  termsVersionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  acceptedTermsCheckbox: z.literal(true),
  source: z.enum(["web", "mobile", "admin"]),
  locale: z.string().max(10).optional(),
}).strict();
```

### Integração no criarReservaSchema:

```typescript
body: z.object({
  barbearia: z.string().regex(...),
  servico: z.string().regex(...),
  dataHora: z.string().refine(...),
  valor: z.number().positive().optional(),
  acceptedTerms: acceptedTermsSchema.optional(),  // ← novo, opcional
}).strict(),
```

## 4. Campos Permitidos

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `termsVersionId` | string | Sim (quando acceptedTerms presente) | ObjectId regex 24 hex |
| `acceptedTermsCheckbox` | literal true | Sim | Apenas `true` aceito |
| `source` | enum | Sim | "web" \| "mobile" \| "admin" |
| `locale` | string | Não | max 10 chars |

## 5. Campos Proibidos (rejeitados pelo .strict())

| Campo server-owned | Resultado ao enviar |
|---|---|
| `serviceSnapshot` | 400 — unrecognized_keys |
| `priceCents` | 400 — unrecognized_keys |
| `durationMinutes` | 400 — unrecognized_keys |
| `cancellationWindowHours` | 400 — unrecognized_keys |
| `arrivalToleranceMinutes` | 400 — unrecognized_keys |
| `paymentExpirationMinutes` | 400 — unrecognized_keys |
| `refundPolicySummary` | 400 — unrecognized_keys |
| `noShowPolicySummary` | 400 — unrecognized_keys |
| `clientIpHash` | 400 — unrecognized_keys |
| `userAgentHash` | 400 — unrecognized_keys |
| `acceptedAt` | 400 — unrecognized_keys |
| `barbeariaId` | 400 — unrecognized_keys |
| `userId` | 400 — unrecognized_keys |
| `checkboxLabelSnapshot` | 400 — unrecognized_keys |
| `acceptanceTextSnapshot` | 400 — unrecognized_keys |
| `reservaId` | 400 — unrecognized_keys |

## 6. Estratégia contra Mass Assignment

Dupla proteção:

1. **Zod `.strict()`** no `acceptedTermsSchema`: rejeita qualquer campo não listado com HTTP 400 antes de chegar ao controller.
2. **Backend server-owned** no `criarReservaComAceite` (C4): mesmo que um campo passasse pelo schema, o service ignora e monta todos os campos de snapshot a partir de fontes confiáveis.

O middleware `validateRequest` aplica o schema e substitui `req.body` pelo resultado sanitizado do parse.

## 7. Estratégia de Retrocompatibilidade

- `acceptedTerms` é `.optional()` no schema.
- Quando ausente, o body original (sem acceptedTerms) passa pela validação normalmente.
- O controller delega para `criarReserva` quando `acceptedTerms` está ausente.
- Nenhum comportamento existente foi alterado.

## 8. Testes Criados

### 10 Suítes de Teste, 41 Testes Novos:

| Grupo | # Testes | Validação |
|---|---|---|
| Retrocompatibilidade (sem acceptedTerms) | 6 | Body válido/inválido sem acceptedTerms |
| acceptedTerms válido | 4 | Input válido com todas variações |
| Validação de checkbox | 3 | false, ausente, string "true" |
| Validação de termsVersionId | 2 | inválido, ausente |
| Validação de source | 2 | inválido, ausente |
| Mass assignment server-owned | 16 | 16 campos rejeitados individualmente |
| Mass assignment body raiz | 2 | paymentStatus, status injetados |
| Ausência de Pix/payment_pending | 3 | payment_pending, pixQrCode, webhookUrl |
| Sub-schema isolado | 3 | Objeto vazio, válido, campo extra |
| **Total** | **41** | |

## 9. Resultado dos Testes

```
Test Suites: 10 passed, 10 total
Tests:       146 passed, 146 total
Snapshots:   0 total
```

## 10. TypeScript

```
npx tsc --noEmit → 0 erros
```

## 11. Auditorias

| Auditoria | Resultado |
|---|---|
| Artifacts (node_modules, dist, .next, build, coverage, .map) | ✅ Limpo |
| .env | ✅ Apenas env.ts (config, não segredo) |
| Secrets | ✅ Limpo |
| Escopo (client/, routes, Reserva.ts, controllers) | ✅ Limpo |
| Pix/payment_pending no diff | ✅ Limpo |

## 12. Confirmações Explícitas

| Item | Status |
|---|---|
| Frontend alterado | ❌ Não |
| Rotas novas | ❌ Não |
| Controllers novos | ❌ Não |
| Controllers existentes alterados | ❌ Não |
| Services alterados | ❌ Não |
| Reserva.ts alterado | ❌ Não |
| payment_pending ativado | ❌ Não |
| Pix real | ❌ Não |
| Webhook novo | ❌ Não |
| QR real | ❌ Não |
| Provider real | ❌ Não |
| .env commitado | ❌ Não |
| Stripe Connect | ❌ Não |
| SaaS billing real | ❌ Não |
| Fundo de Impacto real | ❌ Não |
| Split de pagamento | ❌ Não |

## 13. Decisão

**DECISÃO: PHASE C5 IMPLEMENTADA COM HARDENING DO CONTRATO ACCEPTEDTERMS NA CRIAÇÃO DE RESERVA, PROTEÇÃO CONTRA MASS ASSIGNMENT VIA ZOD .STRICT() E RETROCOMPATIBILIDADE PRESERVADA, SEM FRONTEND, SEM ROTAS NOVAS, SEM RESERVA.TS, SEM PAYMENT_PENDING, SEM PIX REAL, WEBHOOK, QR REAL OU PROVIDER REAL. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
