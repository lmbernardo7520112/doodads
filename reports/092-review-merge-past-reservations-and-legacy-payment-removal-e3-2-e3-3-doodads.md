# 092 — Review Merge Past Reservations and Legacy Payment Removal (E3.2 + E3.3) — Doodads

**Data**: 2026-07-07  
**PR**: [#31](https://github.com/lmbernardo7520112/doodads/pull/31)  
**Branch**: `fix/doodads-past-reservations-ux-and-cancel-hardening-phase-e3-2`  
**Merge commit**: `b3161af`  

---

## 1. Estado Inicial do PR #31

| Campo | Valor |
|---|---|
| Título | fix(payments): past reservation hardening + legacy simulated payment removal + DOC-P0 preservation |
| Estado | OPEN → MERGED |
| Mergeable | MERGEABLE (clean) |
| Arquivos alterados | 48 |
| Adições | +2.875 |
| Remoções | -484 |
| Body | Atualizado via REST API com conteúdo do report 091 |

---

## 2. Preservação DOC-P0

| Verificação | Resultado |
|---|---|
| `docs/payments/manual-payment-current-state.md` | ✅ Presente |
| `docs/payments/payment-documentation-traceability-matrix.md` | ✅ Presente |
| `docs/payments/payment-terminology-governance.md` | ✅ Presente |
| `docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md` | ✅ Presente |
| Diff sem deleção de `docs/` | ✅ Confirmado pré e pós merge |

---

## 3. Validação E3.2 — Reservas Passadas

### Backend
| Cenário | Resultado |
|---|---|
| Reserva passada + cliente → `ALREADY_OCCURRED` | ✅ (`reserva.service.ts` L240) |
| Reserva futura dentro do cutoff → `TOO_LATE` | ✅ (`reserva.service.ts` L248) |
| Reserva futura fora do cutoff → cancelamento permitido | ✅ |
| Usuário privilegiado pode cancelar reservas passadas | ✅ (check `isPrivileged`) |
| Sem auto-finalização no banco | ✅ (sem scheduler, sem mutação silenciosa) |

### Frontend
| Cenário | Resultado |
|---|---|
| `canCancel` exige `!isPast` | ✅ (`AppointmentCard.tsx`) |
| Badge "Horário já passou" para reservas passadas | ✅ |
| Botão "Cancelar" oculto para reservas passadas | ✅ |
| `/home` filtra reservas passadas | ✅ (`home/page.tsx`) |
| `/reservas` com 4 abas (Ativas/Passadas/Canceladas/Todas) | ✅ (`reservas/page.tsx`) |

---

## 4. Validação E3.3 — Remoção do Legado

### Seed
| Verificação | Resultado |
|---|---|
| Seed não cria reserva `paid` instantânea | ✅ (`status: "pendente"`, `paymentStatus: "pending"`) |
| Seed não usa `"aprovado"` | ✅ |
| Pagamento legado Stripe removido do seed | ✅ |

### Código removido
| Item | Status |
|---|---|
| `PATCH /:id/pagar` (rota) | ✅ Removido |
| `pagarReservaSimulado` (controller) | ✅ Removido |
| `pagarReservaSimulado` (service) | ✅ Removido |
| `canPay` (policy) | ✅ Removido |
| `FORBIDDEN_PAY` (error mapping) | ✅ Removido |
| `ALREADY_PAID` (error mapping legado do controller) | ✅ Removido |
| Grep em código ativo | ✅ 0 referências |

### ALREADY_PAID no fluxo governado
| Localização | Status |
|---|---|
| `bookingPaymentManual.service.ts` L226 | ✅ Válido — codeMap de confirmação manual |
| `ALREADY_PAID_CANCEL` em `reserva.service.ts` | ✅ Válido — proteção retrocompatível |

---

## 5. Arquivos Funcionais Revisados

| Arquivo | Tipo | Alteração |
|---|---|---|
| `server/services/reserva.service.ts` | Backend | `ALREADY_OCCURRED`, propagação cancel→BP, remoção `pagarReservaSimulado` |
| `server/controllers/reserva.controller.ts` | Backend | Remoção `pagarReservaSimulado`, error mappings legados |
| `server/routes/reserva.routes.ts` | Backend | Remoção rota `/pagar`, adição rota `/declarar-pago` |
| `server/policies/reserva.policy.ts` | Backend | Remoção `canPay` |
| `server/seed/populateDataBaseSeed.ts` | Backend | Seed realista `pending` |
| `server/services/bookingPaymentManual.service.ts` | Backend | `reportManualBookingPayment`, `listarPagamentosManuais` |
| `server/controllers/bookingPaymentManual.controller.ts` | Backend | `declararPagamentoManual` |
| `client/components/ui/AppointmentCard.tsx` | Frontend | `canCancel !isPast`, badge, "Já enviei o Pix" |
| `client/app/reservas/page.tsx` | Frontend | 4 abas de filtro |
| `client/app/home/page.tsx` | Frontend | Filtro de reservas passadas |
| `client/components/BarberDashboard.tsx` | Frontend | Confirmação/expiração visual |
| `client/components/ui/ConfirmModal.tsx` | Frontend | **NOVO** — modal de confirmação |

---

## 6. Arquivos Documentais Revisados

| Documento | Alteração |
|---|---|
| `reports/059` | Adendo E3.3: `"aprovado"` não mais gerado |
| `reports/060` | Adendo E3.3: mesmo |
| `reports/067` | Adendo E3.3: `ALREADY_PAID` no fluxo governado |
| `reports/068` | Adendo E3.3: mesmo |
| `reports/069` | Adendo E3.3: mesmo |
| `reports/070` | Adendo E3.3: mesmo |
| `reports/086` | Adendo E3.3: bloqueio `"aprovado"` retrocompatível |
| `reports/087` | Novo — E3.1 residual data |
| `reports/088` | Adendo E3.3: referência ao report 091 |
| `reports/091` | Novo — E3.3 seed cleanup + legacy removal |
| `docs/payments/manual-payment-current-state.md` | "Já enviei o Pix" IMPLEMENTADO, seção 5 legado removido |
| `docs/payments/payment-documentation-traceability-matrix.md` | 3 linhas atualizadas/adicionadas |
| `docs/payments/payment-terminology-governance.md` | "Pagamento Simulado" adicionado aos termos proibidos |

---

## 7. Gates Pós-Merge

| Gate | Resultado |
|---|---|
| Testes backend (`main`) | ✅ 23 suítes, 355 testes |
| TypeScript (`main`) | ✅ 0 erros |
| Build frontend (`main`) | ✅ 7 rotas |
| Auditoria de artifacts | ✅ Clean |
| Auditoria de .env | ✅ Nenhum versionado |
| Auditoria de secrets | ✅ Clean |
| Auditoria DOC-P0 | ✅ Preservada |

---

## 8. Fora de Escopo Confirmado

- ❌ Pix real não implementado
- ❌ QR Code Pix não implementado
- ❌ Webhook não implementado
- ❌ Provider não escolhido
- ❌ Stripe não implementado
- ❌ Split não implementado
- ❌ Custódia não implementada
- ❌ `pagarReservaSimulado` não reintroduzido

---

## 9. Decisão

**DECISÃO: PR #31 REVISADO, MERGEADO E VALIDADO. A MAIN PRESERVA A DOC-P0, INCORPORA O HARDENING DE RESERVAS PASSADAS DA E3.2 E REMOVE O FLUXO LEGADO DE PAGAMENTO SIMULADO NA E3.3. O SEED FOI CORRIGIDO PARA ESTADO REALISTA, `PATCH /:id/pagar`, `pagarReservaSimulado`, `canPay` E `FORBIDDEN_PAY` NÃO EXISTEM COMO FLUXO ATIVO, E OS DOCUMENTOS HISTÓRICOS RECEBERAM ADENDOS. TESTES (23 SUÍTES / 355), TYPESCRIPT (0 ERROS), BUILD FRONTEND (7 ROTAS) E AUDITORIAS PERMANECERAM VERDES PÓS-MERGE. NÃO HOUVE PIX REAL, PROVIDER, WEBHOOK, QR, STRIPE, SPLIT OU CUSTÓDIA.**
