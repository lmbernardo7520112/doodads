# Report 087 — Manual Payment Residual Data and Filters Hardening — Phase E3.1

**Data**: 2025-07-07
**Branch**: `fix/doodads-manual-payment-residual-data-and-filters-hardening-phase-e3-1`
**Base**: `fix/doodads-manual-payment-integrity-and-client-flow-hardening-phase-e3` @ `acc2e10`

---

## Objetivo

Corrigir defeitos residuais identificados na validação visual pós-Phase E3:
1. Dados legados pré-E3 com inconsistência BookingPayment/Reserva
2. Listagem operacional do barbeiro sem defesa contra reservas canceladas como pendentes
3. Cliente sem filtros para separar reservas ativas e canceladas

---

## Diagnóstico dos Dados Legados

### Estado pré-migração

| Reserva (ID) | `reserva.status` | `reserva.paymentStatus` | `BookingPayment.status` | Problema |
|---|---|---|---|---|
| 8054 | `cancelado` | **`pending`** ⚠️ | **`pending`** ⚠️ | Cancelada antes da E3 — não propagou |
| 81a8 | `cancelado` | **`pending`** ⚠️ | **`pending`** ⚠️ | Cancelada antes da E3 — não propagou |
| 8062 | `cancelado` | `paid` | `paid` | Caso legítimo de teste — ignorado |

### Causa raiz

As reservas foram canceladas ANTES da Phase E3 adicionar a lógica de propagação em `cancelarReserva()`. O código antigo atualizava apenas `reserva.status = "cancelado"`, sem propagar para `BookingPayment.status` nem atualizar `reserva.paymentStatus`.

### Por que não executar migration no startup do servidor

- Migração altera dados persistentes — não pode ser efeito colateral de inicialização
- Script one-shot permite dry-run para auditoria antes de aplicar
- Execução repetida é segura (idempotente) mas deve ser intencional
- Ambientes diferentes podem ter estados diferentes — o operador precisa validar antes

---

## Defeitos Corrigidos

### P0 — Dados legados corrigidos via script one-shot

**Script**: `server/scripts/fix-pre-e3-cancelled-booking-payments.ts`

**Regras**:
- Busca reservas com `status = "cancelado"` e `bookingPaymentId` existente
- Se `BookingPayment.status === "pending"`: atualiza para `"cancelled"` com metadata de audit
- Se `Reserva.paymentStatus === "pending"`: atualiza para `"cancelled"`
- Não altera `BookingPayment.status` !== `"pending"` (paid, expired, refunded, failed, manual_review)
- Idempotente: execução repetida detecta "already_fixed"
- Bloqueia execução em URLs de produção (mongodb+srv://, atlas, prod)

**Dry-run executado**:
```
Analyzed:      3
Fixed:         2 (would fix)
Ignored:       1
Mode:          DRY-RUN
```

**Apply executado (banco local)**:
```
Analyzed:      3
Fixed:         2
Ignored:       1
Already fixed: 0
Mode:          APPLY
```

**Idempotência verificada (re-run)**:
```
Analyzed:      3
Fixed:         0
Ignored:       1
Already fixed: 2
Mode:          APPLY
```

### P1 — Listagem operacional do barbeiro fortalecida

**Alteração**: `bookingPaymentManual.service.ts` → `listarPagamentosManuais()`

**O que mudou**:
- Após populate e mapeamento, quando filtro ativo é `"pending"` ou `overdueOnly`, exclui da resposta itens cuja `reserva.status === "cancelado"`
- Ajusta contagem total para refletir exclusão
- Garante que mesmo sem migration, pagamentos de reservas canceladas não poluem "Pendentes"
- `canConfirm` e `canExpire` já eram false para reservas canceladas (E3)

### P1 — Filtros na listagem do cliente

**`/reservas`** (client/app/reservas/page.tsx):
- Adicionados filtros por tab: **Ativas** (pendente+confirmado), **Canceladas**, **Todas**
- Aba "Ativas" é default — canceladas não poluem a listagem principal
- Count badges em cada tab
- Empty states específicos por filtro

**`/home`** (client/app/home/page.tsx):
- Cards de agendamento agora exibem **apenas reservas ativas** (`status !== "cancelado" && status !== "finalizado"`)
- Texto empty state alterado para "Nenhum agendamento ativo."

### Correção auxiliar — Teste de contagem de status

**Alteração**: `paymentStatusPresenter.test.ts`
- `allPaymentStatuses` retorna 11 (não 10) após adição de `"cancelled"` na E3
- Teste atualizado: `expect(all).toHaveLength(11)`

### Correção auxiliar — Mock de teste E3

**Alteração**: `manualPaymentIntegrity.phase-e3.test.ts`
- Mock `dataHora` alterado de 1h para 24h no futuro
- Evita falha por política de cancelamento (cutoff de 60min)

---

## Arquivos Alterados

### Backend
| Arquivo | Alteração |
|---|---|
| `server/scripts/fix-pre-e3-cancelled-booking-payments.ts` | **NOVO** — Script de migração one-shot |
| `server/services/bookingPaymentManual.service.ts` | Post-populate filter: exclui canceladas do filtro "pending" |

### Frontend
| Arquivo | Alteração |
|---|---|
| `client/app/reservas/page.tsx` | Filtros Ativas/Canceladas/Todas com count badges |
| `client/app/home/page.tsx` | Cards de agendamento exibem apenas ativas |

### Testes
| Arquivo | Alteração |
|---|---|
| `server/tests/residualDataAndFilters.phase-e3-1.test.ts` | **NOVO** — 13 testes (10 migration + 3 filter) |
| `server/tests/paymentStatusPresenter.test.ts` | Fix count: 10 → 11 |
| `server/tests/manualPaymentIntegrity.phase-e3.test.ts` | Fix mock dataHora: 1h → 24h |

---

## Testes

### Novos (13/13 ✅)
#### Migration Logic (10 testes)
1. ✅ cancelled + pending → fix
2. ✅ cancelled + paid → ignore
3. ✅ cancelled + expired → ignore
4. ✅ cancelled + refunded → ignore
5. ✅ cancelled + failed → ignore
6. ✅ cancelled + manual_review → ignore
7. ✅ cancelled + cancelled → already_fixed (idempotent)
8. ✅ pendente + pending → ignore
9. ✅ confirmado + pending → ignore
10. ✅ finalizado + pending → ignore

#### Listing Filter Logic (3 testes)
11. ✅ pending filter excludes cancelled-reserva items
12. ✅ all filter includes cancelled-reserva items
13. ✅ cancelled-reserva items have canConfirm=false

### Suite completa
- **21 suites, 340/340 PASSED** ✅ (zero failures)

---

## Gates Executados

| Gate | Status |
|---|---|
| `npx tsc --noEmit` (server) | ✅ |
| `npm run test` (server) — 340/340 | ✅ |
| `npx next build` (client) | ✅ |
| Migration dry-run | ✅ |
| Migration apply (local) | ✅ |
| Migration idempotency | ✅ |
| Auditoria de artifacts | ✅ limpo |
| Auditoria de .env | ✅ limpo |
| Auditoria de secrets | ✅ limpo |
| Auditoria de Pix/Stripe indevidos | ✅ limpo |

---

## Ausência de Pix Real / Provider / Webhook

- ❌ Nenhum Pix real implementado
- ❌ Nenhum QR Code gerado
- ❌ Nenhum copia-e-cola
- ❌ Nenhum webhook
- ❌ Nenhum provider real
- ❌ Nenhum Stripe Checkout / Connect
- ❌ Nenhum split / carteira / custódia
- ❌ Nenhuma chave Pix exposta
- ❌ Nenhuma credencial real
- ❌ Nenhum reembolso automático
- ❌ Nenhum cron/scheduler
- ❌ Nenhuma migration automática no startup

---

## Limitações Remanescentes

1. **"Já paguei"**: Não implementado — etapa futura
2. **Reembolso automático**: Fora de escopo
3. **Scheduler de expiração**: Não implementado
4. **Soft-delete/archive de reservas**: Não implementado — apenas filtro visual

---

## Decisão

**DECISÃO: PHASE E3.1 IMPLEMENTADA COM HARDENING RESIDUAL DE DADOS E FILTROS. DADOS LEGADOS PRÉ-E3 FORAM TRATADOS POR SCRIPT ONE-SHOT IDEMPOTENTE COM DRY-RUN, SEM MIGRAÇÃO AUTOMÁTICA NO STARTUP. LISTAGEM DO BARBEIRO FOI PROTEGIDA CONTRA RESERVAS CANCELADAS COMO PENDENTES ACIONÁVEIS. CLIENTE PASSOU A TER FILTROS ATIVAS/CANCELADAS/TODAS, E HOME NÃO PRIORIZA RESERVAS CANCELADAS. TESTES, TYPESCRIPT, BUILD FRONTEND E AUDITORIAS PERMANECEM VERDES. NENHUM PIX REAL, QR, COPIA-E-COLA, WEBHOOK, PROVIDER, STRIPE, SPLIT OU CUSTÓDIA FOI INTRODUZIDO.**
