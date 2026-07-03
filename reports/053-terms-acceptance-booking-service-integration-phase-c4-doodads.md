# Phase C4: Integração Backend TermsAcceptance ao Service de Reservas — Relatório 053

## 1. Objetivo

Implementar a primeira integração backend controlada entre criação de reserva e TermsAcceptance, de forma retrocompatível, sem frontend, sem rotas novas, sem Pix, sem payment_pending e sem QR.

## 2. Arquivos Alterados

| Arquivo | Tipo | Alteração |
|---|---|---|
| `server/services/reserva.service.ts` | Modificado | Adição de `criarReservaComAceite`, imports, interfaces e mapas de policy summary |
| `server/controllers/reserva.controller.ts` | Modificado | Delegação retrocompatível de `acceptedTerms` no `criarReserva` |
| `server/repositories/termsVersion.repository.ts` | Modificado | Adição de `findById` |
| `server/tests/reservaTermsIntegration.service.test.ts` | Criado | 13 testes dedicados da integração C4 |

**Nenhum arquivo em `client/`, `server/routes/`, `server/models/Reserva.ts` foi alterado.**

## 3. Estratégia de Retrocompatibilidade

- O método `criarReserva` permanece intacto — fluxo antigo funciona sem acceptedTerms.
- Quando `acceptedTerms` está presente no body, o controller delega para `criarReservaComAceite`.
- Quando ausente, o controller delega para `criarReserva` (fluxo original).
- Reserva.ts não foi alterado — não possui `termsAcceptanceId`. A vinculação é feita via `TermsAcceptance.reservaId`.

## 4. Como o Snapshot é Montado pelo Servidor

O cliente envia apenas 4 campos: `termsVersionId`, `acceptedTermsCheckbox`, `source`, `locale`.

O backend monta os 17 campos server-owned:

| Campo | Fonte |
|---|---|
| reservaId | Gerado após `criarReserva` |
| barbeariaId | `req.body.barbearia` validado |
| userId | `req.user.id` (JWT) |
| acceptedAt | `new Date()` no servidor |
| checkboxLabelSnapshot | `"Li e aceito os {title} (versão {version})."` |
| acceptanceTextSnapshot | `TermsVersion.content` |
| servicoNome | `Servico.nome` |
| priceCents | `Math.round(Servico.preco * 100)` |
| scheduledAt | `dataHora` validada |
| durationMinutes | `Servico.duracaoMin` |
| arrivalToleranceMinutes | `BookingPolicy.arrivalToleranceMinutes` |
| paymentExpirationMinutes | `BookingPolicy.paymentExpirationMinutes` |
| cancellationWindowHours | `BookingPolicy.cancellationWindowHours` |
| refundPolicySummary | Mapa legível de `BookingPolicy.refundPolicy` |
| noShowPolicySummary | Mapa legível de `BookingPolicy.noShowPolicy` |
| clientIpHash | `hashSensitiveValue("client_ip", req.ip)` |
| userAgentHash | `hashSensitiveValue("user_agent", req.headers['user-agent'])` |

## 5. Validações Implementadas

| Validação | Código | HTTP |
|---|---|---|
| Checkbox não marcado | `TERMS_CHECKBOX_NOT_ACCEPTED` | 400 |
| TermsVersion não encontrada | `TERMS_VERSION_NOT_FOUND` | 404 |
| TermsVersion inativa | `TERMS_VERSION_INACTIVE` | 409 |
| TermsVersion de tipo incorreto | `TERMS_VERSION_TYPE_MISMATCH` | 400 |
| Validações existentes de reserva | (preservadas) | 400/404/409 |

## 6. Proteção contra Mass Assignment

Campos server-owned enviados pelo cliente no `acceptedTerms` são ignorados. O `AcceptedTermsInput` define apenas os 4 campos permitidos. O service monta todos os campos de snapshot a partir de fontes confiáveis.

## 7. Testes Criados

| # | Teste | Resultado |
|---|---|---|
| 1 | Retrocompatibilidade: criarReserva sem acceptedTerms | ✅ |
| 2 | criarReservaComAceite com input válido | ✅ |
| 3 | Snapshot com dados reais do servidor | ✅ |
| 4 | Hash de IP e User-Agent via hashSensitiveValue | ✅ |
| 5 | Funciona sem IP e User-Agent | ✅ |
| 6 | Locale default pt-BR quando omitido | ✅ |
| 7 | Rejeição de checkbox false | ✅ |
| 8 | Rejeição de termsVersionId inexistente | ✅ |
| 9 | Rejeição de TermsVersion inativa | ✅ |
| 10 | Rejeição de TermsVersion de tipo incorreto | ✅ |
| 11 | Mass assignment ignorado | ✅ |
| 12 | Ausência de Pix/payment_pending | ✅ |
| 13 | Reserva.ts sem termsAcceptanceId | ✅ |

## 8. Resultados dos Testes

```
Test Suites: 9 passed, 9 total
Tests:       105 passed, 105 total
Snapshots:   0 total
```

## 9. TypeScript

```
npx tsc --noEmit → 0 erros
```

## 10. Auditorias

| Auditoria | Resultado |
|---|---|
| Artifacts (node_modules, dist, .next, build, coverage, .map) | ✅ Limpo |
| .env | ✅ Apenas env.ts (config, não segredo) |
| Secrets | ✅ Limpo |
| Escopo (client/, routes novas, Reserva.ts) | ✅ Limpo |
| Pix/payment_pending no código novo | ✅ Limpo |

## 11. Confirmações Explícitas

| Item | Status |
|---|---|
| Frontend alterado | ❌ Não |
| Rotas novas | ❌ Não |
| Controllers novos | ❌ Não |
| Reserva.ts alterado | ❌ Não |
| payment_pending ativado | ❌ Não |
| Pix real | ❌ Não implementado |
| Webhook novo | ❌ Não implementado |
| QR real | ❌ Não implementado |
| Provider real | ❌ Não implementado |
| .env commitado | ❌ Não |
| Stripe Connect | ❌ Não implementado |
| SaaS billing real | ❌ Não implementado |

## 12. Decisão

DECISÃO: PHASE C4 IMPLEMENTADA COM INTEGRAÇÃO BACKEND RETROCOMPATÍVEL DE TERMSACCEPTANCE AO SERVICE DE RESERVAS, SEM FRONTEND, SEM ROTAS NOVAS, SEM PAYMENT_PENDING, SEM PIX REAL, WEBHOOK, QR REAL OU PROVIDER REAL. FLUXO ANTIGO PRESERVADO, TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.
