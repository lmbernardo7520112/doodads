# Phase C2: TermsAcceptance Snapshot Service — Relatório 049

## 1. Objetivo da Fase

Implementar a fundação de TermsAcceptance com repository/service/testes para registrar aceite explícito com snapshot mínimo de serviço e políticas, com hashing de IP/User-Agent via SHA-256, **sem** ativar o aceite no fluxo público de reservas, sem frontend, sem rotas, sem controllers, sem Pix real, sem webhook, sem QR real e sem alteração de Reserva.ts.

## 2. Arquivos Criados

| Arquivo | Descrição |
|---|---|
| `server/repositories/termsAcceptance.repository.ts` | Repository com create, findByReservaId, findByUserAndTermsVersion, countByReservaId |
| `server/services/termsAcceptance.service.ts` | Service com createTermsAcceptanceSnapshot, hashSensitiveValue, validações de negócio |
| `server/tests/termsAcceptance.service.test.ts` | 26 testes cobrindo hash, snapshot, validações, vínculo e escopo |
| `reports/049-terms-acceptance-snapshot-service-phase-c2-doodads.md` | Este relatório |

**Nenhum** controller, route, model Reserva.ts, serviço de reserva ou arquivo de client foi alterado.

## 3. Estratégia de Snapshot

O `serviceSnapshot` captura no momento do aceite:

| Campo | Tipo | Origem |
|---|---|---|
| `servicoNome` | string (required) | Nome do serviço agendado |
| `priceCents` | number (required) | Preço em centavos |
| `scheduledAt` | Date (required) | Data/hora agendada |
| `durationMinutes` | number (optional) | Duração do serviço em minutos |
| `arrivalToleranceMinutes` | number (optional) | Tolerância de chegada da BookingPolicy |
| `paymentExpirationMinutes` | number (optional) | Prazo de pagamento da BookingPolicy |
| `cancellationWindowHours` | number (optional) | Janela de cancelamento da BookingPolicy |
| `refundPolicySummary` | string (optional) | Resumo legível da política de reembolso |
| `noShowPolicySummary` | string (optional) | Resumo legível da política de no-show |

Os campos obrigatórios do snapshot (servicoNome, priceCents, scheduledAt) são validados pelo Mongoose schema. Os campos de política são opcionais, permitindo que barbearias sem BookingPolicy configurada ainda possam ter aceites registrados.

## 4. Estratégia de Hash de IP/User-Agent

| Aspecto | Implementação |
|---|---|
| Algoritmo | SHA-256 (`crypto.createHash("sha256")`) |
| Payload | `${domain}::${value}` com domínio `client_ip` ou `user_agent` |
| Separador de domínio | `::` evita colisão entre campos |
| Determinismo | Mesmo input → mesmo hash, sempre |
| Privacidade | IP e User-Agent **nunca** são persistidos em texto puro |
| Verificabilidade | Se o IP for conhecido, o hash pode ser recalculado para comparação |
| Campos opcionais | Se IP ou User-Agent não forem fornecidos, os campos hash ficam `undefined` |

## 5. Validações Implementadas

| Validação | Tipo | Mensagem |
|---|---|---|
| `checkboxLabelSnapshot` vazio ou espaços | Service | "checkboxLabelSnapshot não pode ser vazio" |
| `acceptanceTextSnapshot` vazio ou espaços | Service | "acceptanceTextSnapshot não pode ser vazio" |
| `source` inválido (fora de web/mobile/admin) | Service | "source inválido: '{value}'" |
| `servicoNome` vazio | Service | "serviceSnapshot.servicoNome não pode ser vazio" |
| `priceCents` negativo | Service | "serviceSnapshot.priceCents não pode ser negativo" |
| `source` enum (web/mobile/admin) | Mongoose | Validação de schema |
| Campos required (reservaId, barbeariaId, termsVersionId, etc.) | Mongoose | Validação de schema |

## 6. Testes Criados

**Arquivo**: `server/tests/termsAcceptance.service.test.ts`

| Grupo | Testes | Descrição |
|---|---|---|
| hashSensitiveValue | 4 | Determinismo IP, determinismo UA, diferença por IP, diferença por domínio |
| createTermsAcceptanceSnapshot | 5 | Snapshot completo, serviceSnapshot completo, sem userId, sem IP hash, sem UA hash |
| hashing no documento | 4 | IP hash SHA-256 sem IP puro, UA hash SHA-256 sem UA puro, recálculo IP, recálculo UA |
| validações | 9 | checkboxLabel vazio, espaços, acceptanceText vazio, source inválido, servicoNome vazio, priceCents negativo, source web/mobile/admin |
| vínculo com TermsVersion | 2 | termsVersionId correto, referência a TermsVersion real no banco |
| preservação de escopo | 2 | Nenhum IP/UA em texto puro no JSON, sem referências a controller/route |

**Total: 26 testes novos**

## 7. Comandos Executados

```bash
git checkout main
git pull origin main
git checkout -b feat/doodads-terms-acceptance-snapshot-service-phase-c2
cd server && npx tsc --noEmit
cd server && npm run test
git ls-files | grep -E '(^|/)node_modules/|(^|/).next/|(^|/)dist/|(^|/)build/|(^|/)coverage/|.map$'
git ls-files | grep -E '(^|/).env$|.env.'
grep -RIn --exclude-dir=node_modules ... 'PIX.*SECRET=...|...'
git diff --name-only main...HEAD | grep -E '^client/|^server/routes/|^server/controllers/|^server/models/Reserva.ts|^server/services/reserva'
```

## 8. Resultado Real dos Testes

```
Test Suites: 8 passed, 8 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        4.606 s
Ran all test suites.
```

**Todas as 8 suítes passando, 92 testes verdes** (66 anteriores + 26 novos).

## 9. Resultado Real do TypeScript

```
npx tsc --noEmit → 0 erros
```

## 10. Auditoria de Artifacts

Nenhum `node_modules`, `dist`, `.next`, `build`, `coverage` ou `.map` rastreado pelo Git. ✅

## 11. Auditoria de .env/Secrets

- Nenhum `.env` rastreado (apenas `server/config/env.ts` que é configuração tipada).
- Nenhum secret real encontrado no grep. ✅

## 12. Confirmações Explícitas

| Item | Status |
|---|---|
| Pix real | ❌ Não ativado |
| Webhook | ❌ Não ativado |
| QR real | ❌ Não ativado |
| Provider real | ❌ Não ativado |
| Frontend público | ❌ Não alterado |
| Reserva.ts | ❌ Não alterado |
| payment_pending | ❌ Não ativado |
| Rotas públicas | ❌ Não alteradas |
| Controllers | ❌ Não alterados |
| TermsAcceptance no fluxo público | ❌ Não ativado |
| Client | ❌ Não alterado |
| SaaS billing real | ❌ Não implementado |
| Stripe Connect | ❌ Não implementado |
| Split de pagamento | ❌ Não implementado |
| Fundo de Impacto real | ❌ Não implementado |
| Credenciais reais | ❌ Não criadas |
| .env commitado | ❌ Nenhum |

## 13. Decisão

DECISÃO: PHASE C2 IMPLEMENTADA COM TERMSACCEPTANCE SNAPSHOT SERVICE/REPOSITORY, HASH DE IP/USER-AGENT E TESTES DEDICADOS, SEM ATIVAÇÃO DO ACEITE NO FLUXO PÚBLICO, PIX REAL, WEBHOOK, QR REAL, PROVIDER REAL, FRONTEND PÚBLICO, PAYMENT_PENDING OU ALTERAÇÃO DO FLUXO DE RESERVAS. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.

## 14. Próxima Fase Recomendada

DOODADS-TERMS-ACCEPTANCE-SNAPSHOT-SERVICE-PHASE-C2-PR-REVIEW-MERGE — Revisar criticamente o PR, mergear e validar pós-merge.
