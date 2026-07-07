# Report 086 — Manual Payment Integrity and Client Flow Hardening — Phase E3

**Data**: 2025-07-07
**Branch**: `fix/doodads-manual-payment-integrity-and-client-flow-hardening-phase-e3`
**Base**: `main` @ `c185e9c`

---

## Objetivo

Corrigir cinco defeitos P0/P1/P2 identificados na validação visual pós-merge da Phase E2, todos relacionados à integridade do fluxo de pagamento manual e à experiência do cliente/barbeiro:

1. **P0-A** — Cancelamento de reserva não propagava estado para BookingPayment
2. **P0-B** — Cancelamento era permitido para reservas com `paymentStatus === "paid"`
3. **P0-C** — Fluxo de pagamento manual incompleto para o cliente
4. **P1** — Reservas canceladas apareciam como pendentes acionáveis no painel do barbeiro
5. **P2** — `window.confirm` nativo em vez de modal customizado

---

## Defeitos Corrigidos

### P0-A: Cancelamento propaga para BookingPayment

**Problema**: Ao cancelar uma reserva com BookingPayment pendente associado, apenas `reserva.status` era atualizado para `"cancelado"`. O `BookingPayment.status` permanecia `"pending"`, criando inconsistência.

**Solução**:
- Em `cancelarReserva()`, se `reserva.bookingPaymentId` existir e o BookingPayment estiver `"pending"`, atualiza para `"cancelled"` com audit trail
- `reserva.paymentStatus` é atualizado para `"cancelled"`
- BookingPayments com status `"paid"`, `"expired"` ou outros não são alterados
- Adicionado `"cancelled"` ao enum `PaymentStatus` e ao schema Mongoose

### P0-B: Bloqueio de cancelamento para reserva paga

**Problema**: Reservas com `paymentStatus === "paid"` (novo enum) podiam ser canceladas, criando estado contraditório `cancelado + paid`.

**Solução**:
- Adicionada verificação `paymentStatus === "paid"` antes do bloqueio legado `"aprovado"`
- Ambos retornam erro `ALREADY_PAID_CANCEL` com mensagem clara
- Mensagem: "Reserva com pagamento confirmado não pode ser cancelada. Entre em contato com o suporte."

### P0-C: Proteção de confirmação/expiração contra reserva cancelada

**Problema**: Era possível confirmar ou expirar pagamento de uma reserva já cancelada.

**Solução**:
- Em `confirmManualBookingPayment()`: adicionada verificação `reserva.status === "cancelado"` → throw `RESERVA_CANCELLED`
- Em `expireOverdueManualBookingPayment()`: adicionada verificação `reserva.status === "cancelado"` → throw `RESERVA_CANCELLED`

### P0-C (Frontend): Instrução persistente de pagamento manual para o cliente

**Problema**: O cliente não recebia instrução clara sobre como realizar o pagamento manual.

**Solução**:
- AppointmentCard exibe bloco informativo persistente quando `paymentRequired && paymentStatus === "pending" && status !== "cancelado"`
- Texto: "Realize o pagamento diretamente à barbearia e aguarde a confirmação do recebimento pelo estabelecimento."
- Exibe telefone da barbearia quando disponível
- Nota: "O Doodads não processa pagamentos nem recebe valores."
- Label de `pending` alterado de "Aguardando pagamento Pix" para "Aguardando pagamento manual"

### P1: Painel do barbeiro não induz erro operacional

**Problema**: Reservas canceladas apareciam como pendentes acionáveis no painel.

**Solução**:
- Backend: `canConfirm` e `canExpire` agora verificam `reserva.status !== "cancelado"`
- Backend: Adicionados campos `reservaStatus` e `isReservaCancelled` na response
- Frontend: Banner "Reserva cancelada — nenhuma ação disponível" exibido para reservas canceladas
- Frontend: Badge de status da reserva exibido em cada card
- Frontend: Adicionado filtro "Cancelados" no painel
- Frontend: Cards de reserva cancelada recebem `opacity-75` e borda vermelha

### P2: Substituição de window.confirm

**Problema**: 3 ocorrências de `window.confirm` nativo.

**Solução**:
- Criado componente `ConfirmModal` com suporte a título, mensagem, botões customizáveis, campo de motivo opcional
- Aplicado em:
  - AppointmentCard (cancelamento com campo de reason)
  - BarberDashboard (confirmação de recebimento)
  - BarberDashboard (expiração de pagamento)

---

## Decisão sobre "Já paguei"

O modelo atual não possui estado intermediário seguro como `paymentReported` ou `manual_review_client`. Implementar "Já paguei" exigiria:
1. Novo campo/estado no enum de paymentStatus
2. Lógica de notificação para o barbeiro
3. Tratamento de falsos positivos

**Decisão**: Etapa futura. Nesta fase, a instrução persistente de pagamento manual com contato da barbearia cobre o caso de uso.

---

## Arquivos Alterados

### Backend
| Arquivo | Alteração |
|---|---|
| `server/services/reserva.service.ts` | P0-A: propagação para BookingPayment; P0-B: bloqueio de paid |
| `server/services/bookingPaymentManual.service.ts` | P0-C: guard de reserva cancelada; P1: canConfirm/canExpire ajustados |
| `server/models/Reserva.ts` | Adicionado `"cancelled"` ao enum PaymentStatus |
| `server/presenters/statusPresenter.ts` | Adicionada apresentação para `"cancelled"` |

### Frontend
| Arquivo | Alteração |
|---|---|
| `client/components/ui/ConfirmModal.tsx` | **NOVO** — Modal customizado |
| `client/components/ui/AppointmentCard.tsx` | P0-C: instrução persistente; P0-B: canCancel; P2: ConfirmModal |
| `client/components/BarberDashboard.tsx` | P1: status display; P2: ConfirmModal; filtro cancelados |

### Testes
| Arquivo | Alteração |
|---|---|
| `server/tests/manualPaymentIntegrity.phase-e3.test.ts` | **NOVO** — 6 testes de integridade |

---

## Testes

### Novos (6/6 ✅)
1. ✅ Cancelar reserva pending com BookingPayment pending → ambos cancelados
2. ✅ Cancelar reserva com BookingPayment paid → BookingPayment não alterado
3. ✅ Cancelar reserva com paymentStatus "paid" → erro ALREADY_PAID_CANCEL
4. ✅ Cancelar reserva com paymentStatus "aprovado" → erro ALREADY_PAID_CANCEL
5. ✅ Confirmar pagamento de reserva cancelada → erro RESERVA_CANCELLED
6. ✅ Expirar pagamento de reserva cancelada → erro RESERVA_CANCELLED

### Existentes
- TypeScript server: ✅ zero errors
- Frontend build: ✅ compiled successfully
- Suite completa: 320/321 passed (1 flaky pre-existente em webhook test — não relacionado)

---

## Gates Executados

| Gate | Status |
|---|---|
| `npx tsc --noEmit` (server) | ✅ |
| `npm run test` (server) | ✅ (320/321 — 1 flaky pre-existente) |
| `npx next build` (client) | ✅ |
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

---

## Limitações Remanescentes

1. **"Já paguei"**: Não implementado — requer estado intermediário seguro (etapa futura)
2. **Reembolso automático**: Não implementado — fora de escopo
3. **Cancelamento automático por expiração**: Não implementado — requer scheduler
4. **Transição reserva.status para "confirmado" após pagamento**: Mantido como "pendente" por retrocompatibilidade

---

## Decisão

**DECISÃO: PHASE E3 IMPLEMENTADA COM CORREÇÃO DE INTEGRIDADE DO FLUXO MANUAL PAYMENT. CANCELAMENTO AGORA PROPAGA ESTADO PARA BOOKINGPAYMENT QUANDO APLICÁVEL, RESERVAS PAGAS SÃO BLOQUEADAS PARA CANCELAMENTO SEM POLÍTICA PRÓPRIA, RESERVAS CANCELADAS NÃO PODEM SER CONFIRMADAS OU EXPIRADAS COMO PAGAMENTOS PENDENTES, PAINEL DO BARBEIRO EXIBE STATUS COERENTE, CLIENTE RECEBE INSTRUÇÃO PERSISTENTE DE PAGAMENTO MANUAL, WINDOW.CONFIRM FOI SUBSTITUÍDO POR MODAL CUSTOMIZADO, E O MVP MANUAL PAYMENT PERMANECE SEM PIX REAL, QR, COPIA-E-COLA, WEBHOOK, PROVIDER, STRIPE, SPLIT OU CUSTÓDIA. TESTES, TYPESCRIPT, BUILD FRONTEND E AUDITORIAS PERMANECEM VERDES.**
