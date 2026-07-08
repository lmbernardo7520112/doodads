# Matriz de Fluxos Validados — Pagamento Manual — Doodads

Este documento resume a matriz de testes e validações de ponta a ponta executadas na Phase V2 e V2.1 sobre os fluxos lógicos de pagamentos manuais.

| ID Cenário | Caso de Uso / Fluxo | Estado Inicial | Ação / Evento | Estado Final Esperado | Status da Validação | Endpoint / Rota Associada |
|---|---|---|---|---|---|---|
| **01** | Pré-pagamento obrigatório | Barbearia com `requirePrepayment = true` | Cliente cria reserva enviando `acceptedTerms` | Reserva `status = "pendente"`<br>Reserva `paymentStatus = "pending"`<br>`BookingPayment.status = "pending"` |  Validado (V2.1) | `POST /api/reservas` |
| **02** | Declaração do Cliente | Reserva e pagamento em estado `pending` | Cliente clica em "Já enviei o Pix" | Reserva `paymentStatus = "manual_review"`<br>`BookingPayment.status = "manual_review"` |  Validado (V2.1) | `PATCH /api/reservas/pagamento-manual/:id/declarar-pago` |
| **03** | Confirmação do Barbeiro | Pagamento em estado `manual_review` (dentro do prazo) | Barbeiro clica em "Confirmar recebimento" | Reserva `status = "confirmado"`<br>Reserva `paymentStatus = "paid"`<br>`BookingPayment.status = "paid"` |  Validado (V2.1) | `PATCH /api/reservas/pagamento-manual/:id/confirmar` |
| **04** | Expiração de Pagamento | Reserva e pagamento em estado `pending` ou `manual_review` (prazo expirado) | Barbeiro clica em "Marcar como expirado" | Reserva `status = "cancelado"`<br>Reserva `paymentStatus = "expired"`<br>`BookingPayment.status = "expired"` |  Validado (V2.1) | `PATCH /api/reservas/pagamento-manual/:id/expirar` |
| **05** | Cancelamento pelo Cliente (Antes de Pagar) | Reserva e pagamento em estado `pending` | Cliente clica em "Cancelar Reserva" (fora do cutoff) | Reserva `status = "cancelado"`<br>Reserva `paymentStatus = "cancelled"`<br>`BookingPayment.status = "cancelled"` |  Validado (V2.1) | `PATCH /api/reservas/:id/cancelar` |
| **06** | Bloqueio de Cancelamento Pago | Reserva com pagamento `paid` | Cliente tenta cancelar a reserva | Bloqueado com erro `ALREADY_PAID_CANCEL` (HTTP 400) |  Validado (V2.1) | `PATCH /api/reservas/:id/cancelar` |
| **07** | UX Temporal (Reserva Passada) | Reserva no passado (dataHora menor que Now) | Cliente tenta cancelar a reserva | Bloqueado com erro `ALREADY_OCCURRED` (HTTP 400). Botão ocultado no front. |  Validado (V2) | `PATCH /api/reservas/:id/cancelar` |
| **08** | Extinção de Endpoint Legado | Qualquer estado | Requisição direta ao endpoint legado | Retorna HTTP 404. Endpoint inativo. |  Validado (V2) | `PATCH /api/reservas/:id/pagar` |
| **09** | Ausência de Pix Real / Custódia | Qualquer fluxo ativo | Inspeção de telas, logs e banco de dados | Zero geração de QR Code, zero redirecionamento para gateway ou custódia pelo Doodads. |  Validado (V2) | N/A |
