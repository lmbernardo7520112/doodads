# Phase D1 PR #16: Review, Merge & Post-Merge Validation — Relatório 060

## 1. Estado Inicial do PR #16

| Campo | Valor |
|---|---|
| Número | #16 |
| Título | feat(reservas): add payment fields for manual Pix flow |
| Estado | OPEN → MERGED |
| Mergeable | MERGEABLE |
| Arquivos alterados | 3 |
| Adições | +457 |
| Deleções | -6 |
| Branch | `feat/doodads-manual-pix-reserva-payment-fields-phase-d1` → `main` |
| URL | https://github.com/lmbernardo7520112/doodads/pull/16 |

## 2. Arquivos Alterados

| Arquivo | Ação |
|---|---|
| `server/models/Reserva.ts` | Modificado |
| `server/tests/reservaPaymentFields.model.test.ts` | Criado |
| `reports/059-manual-pix-reserva-payment-fields-phase-d1-doodads.md` | Criado |

## 3. Confirmação de Escopo

| Verificação | Resultado |
|---|---|
| `client/` alterado | ❌ Não |
| `server/routes/` alterado | ❌ Não |
| `server/controllers/` alterado | ❌ Não |
| `server/services/` alterado | ❌ Não |
| `server/schemas/` alterado | ❌ Não |
| Ativação funcional | ❌ Menções a payment_pending apenas em testes de rejeição |

## 4. Campos Adicionados em Reserva

| Campo | Tipo | Default | Server-Owned |
|---|---|---|---|
| `paymentRequired` | Boolean | `false` | ✅ |
| `bookingPaymentId` | ObjectId ref BookingPayment | undefined | ✅ |
| `termsAcceptanceId` | ObjectId ref TermsAcceptance | undefined | ✅ |
| `paymentExpiresAt` | Date | undefined | ✅ |
| `confirmedAt` | Date | undefined | ✅ |
| `noShowMarkedAt` | Date | undefined | ✅ |
| `noShowMarkedBy` | ObjectId ref User | undefined | ✅ |
| `cancelledAt` | Date | undefined | ✅ |
| `completedAt` | Date | undefined | ✅ |

## 5. Análise de Retrocompatibilidade

| Aspecto | Verificação |
|---|---|
| Status principal enum | ✅ Inalterado: `["pendente", "confirmado", "cancelado", "finalizado"]` |
| paymentStatus default | ✅ Mantém `"pendente"` (legado) |
| Valores legados | ✅ `"pendente"`, `"aprovado"`, `"falhou"` preservados |
| Campos opcionais | ✅ Todos opcionais, sem `required: true` |
| Reservas existentes | ✅ Não são afetadas — defaults seguros |
| Pre-save hook | ✅ Mantido intacto |

## 6. Análise do paymentStatus: Legado × Novo

### Enum Completo (10 valores)

| Valor | Idioma | Tipo | Origem |
|---|---|---|---|
| `pendente` | PT | Legado (Stripe) | Default legado |
| `aprovado` | PT | Legado (Stripe) | Retrocompatibilidade |
| `falhou` | PT | Legado (Stripe) | Retrocompatibilidade |
| `not_required` | EN | Novo (D1) | Manual Pix |
| `pending` | EN | Novo (D1) | Manual Pix |
| `paid` | EN | Novo (D1) | Manual Pix |
| `expired` | EN | Novo (D1) | Manual Pix |
| `refunded` | EN | Novo (D1) | Manual Pix |
| `failed` | EN | Novo (D1) | Manual Pix |
| `manual_review` | EN | Novo (D1) | Manual Pix |

### Decisão Formal sobre Enums Internos em Inglês

**DECISÃO DELIBERADA:**

1. **Os valores de paymentStatus são códigos internos de domínio**, não textos de interface. São enums de estado técnico armazenados em banco, usados em lógica de negócio e queries MongoDB.

2. **Eles NÃO devem ser exibidos crus ao usuário final.** A interface futura deve utilizar um mapper/presenter que traduz cada código para um label legível em português.

3. **A mistura de idiomas (PT legado + EN novo) é aceita APENAS por retrocompatibilidade.** Os 3 valores legados (`pendente`, `aprovado`, `falhou`) existem em reservas já persistidas e não podem ser removidos sem migração de dados.

4. **Antes de qualquer frontend ou API pública de pagamento**, deve existir uma fase específica de normalização de apresentação com:
   - Mapper de paymentStatus → label em português;
   - Tratamento de todos os 10 valores;
   - Testes do mapper;
   - Ausência de exposição crua de enums.

5. **O padrão para novos valores é inglês**, seguindo convenção de backend técnico. Isso alinha com BookingPayment.status (já em inglês), BookingPolicy, BarbeariaPaymentConfig e TermsAcceptance.

## 7. Análise dos Testes (35)

| Grupo | # | Cobertura |
|---|---|---|
| Retrocompatibilidade | 4 | Reserva antiga, defaults legados |
| Defaults D1 | 9 | paymentRequired false, todos campos undefined |
| Novos paymentStatus | 7 | Cada valor aceito individualmente |
| Rejeição | 3 | paymentStatus inválido, status inválidos |
| ObjectId refs | 3 | bookingPaymentId, termsAcceptanceId, noShowMarkedBy |
| Date fields | 4 | paymentExpiresAt, confirmedAt, cancelledAt, completedAt |
| paymentRequired | 2 | true, false |
| Ausência funcional | 3 | Enum principal, paymentStatus enum, fluxo antigo |

## 8. Resultados Pós-Merge

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
| Ativação funcional | ✅ payment_pending apenas em testes de rejeição |

## 10. Hash do Merge

```
8f94f0f feat(reservas): add payment fields for manual Pix flow (#16)
```

## 11. Correções

Nenhuma correção necessária.

## 12. Decisão

**DECISÃO: PR #16 REVISADO, MERGEADO E VALIDADO. CAMPOS OPCIONAIS E RETROCOMPATÍVEIS DE PAGAMENTO/ACEITE EM RESERVA FORAM INTEGRADOS SEM ATIVAÇÃO FUNCIONAL DE MANUAL_PIX. PAYMENTSTATUS COM VALORES LEGADOS EM PORTUGUÊS E NOVOS VALORES TÉCNICOS EM INGLÊS FOI ACEITO COMO COMPROMISSO DE RETROCOMPATIBILIDADE, COM DECISÃO FORMAL DE QUE ENUMS INTERNOS NÃO DEVEM SER EXIBIDOS CRUS AO USUÁRIO E DEVEM PASSAR POR MAPPER/PRESENTER EM PORTUGUÊS ANTES DE QUALQUER UI/API PÚBLICA DE PAGAMENTO. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
