# 095 — Fresh Manual Prepayment Booking Validation — Phase V2-1 — Doodads

**Data**: 2026-07-08  
**Commit validado**: `a3844e9` (main)  
**Ambiente**: Desenvolvimento local / Banco de dados local MongoDB sintético  

---

## 1. Objetivo

Validar o fluxo ponta a ponta de pré-pagamento manual obrigatório (prepayment). Provar que, ao configurar `BookingPolicy.requirePrepayment = true` e enviar as informações corretas de aceite de termos (`acceptedTerms`), a reserva é criada em estado pendente associando uma fatura manual (`BookingPayment`), a qual pode ser confirmada ou expirada pelo barbeiro via API/dashboard, sem reintroduzir o legado de pagamento simulado e sem acionar integração de Pix real.

---

## 2. Confirmação do Ambiente e Policy

### A. BookingPolicy no MongoDB Local
Foi verificado via script no banco de dados local que a política da barbearia de teste possui a configuração de prepayment ativa:
- **Barbearia ID**: `6a4d774fdff98b80cb8650eb` (Barbearia Estilo Fino)
- **Policy ID**: `6a4d774fdff98b80cb8650ed`
- **requirePrepayment**: `true`
- **paymentExpirationMinutes**: `15`
- **isActive**: `true`

---

## 3. Fluxo Principal — Reserva Fresh com Pré-pagamento

A reserva foi criada via API usando o token do cliente e enviando explicitamente a aceitação dos termos com a versão ativa correspondente (`acceptedTerms`).

### A. Requisição POST `/api/reservas`
- **DataHora**: `2026-07-12T10:00:00.000Z` (data futura fora do cutoff de cancelamento)
- **Body**:
```json
{
  "barbearia": "6a4d774fdff98b80cb8650eb",
  "servico": "6a4d774fdff98b80cb8650f3",
  "dataHora": "2026-07-12T10:00:00.000Z",
  "acceptedTerms": {
    "termsVersionId": "6a4d774fdff98b80cb8650f1",
    "acceptedTermsCheckbox": true,
    "source": "web"
  }
}
```

### B. Response de Sucesso (reserva fresh criada)
```json
{
  "message": "Reserva criada com sucesso!",
  "reserva": {
    "usuario": "6a4d774fdff98b80cb8650e7",
    "barbearia": "6a4d774fdff98b80cb8650eb",
    "servico": "6a4d774fdff98b80cb8650f3",
    "dataHora": "2026-07-12T10:00:00.000Z",
    "status": "pendente",
    "paymentStatus": "pending",
    "paymentRequired": true,
    "_id": "6a4e33be31e57c6c721f010c",
    "bookingPaymentId": "6a4e33be31e57c6c721f0113",
    "paymentExpiresAt": "2026-07-08T11:40:50.903Z"
  },
  "bookingPayment": {
    "reservaId": "6a4e33be31e57c6c721f010c",
    "barbeariaId": "6a4d774fdff98b80cb8650eb",
    "provider": "manual",
    "amountCents": 4000,
    "currency": "BRL",
    "status": "pending",
    "expiresAt": "2026-07-08T11:40:50.903Z"
  }
}
```

**Resultado**:
- A reserva nasce com `status: "pendente"`, `paymentRequired: true` e `paymentStatus: "pending"`.
- O `BookingPayment` associado nasce em estado `pending` com o valor de R$ 40,00 e expiração em 15 minutos, sem chaves Pix reais ou webhook ativo.

---

## 4. Declaração do Cliente e Painel do Barbeiro

### A. Cliente "Já enviei o Pix"
No browser, o cliente logado clicou em **"Já enviei o Pix"** no card da reserva pendente.
- A requisição `PATCH /api/reservas/pagamento-manual/6a4e33be31e57c6c721f0113/declarar-pago` foi disparada.
- O `paymentStatus` da reserva mudou para `"manual_review"` ("Em análise manual").
- O status do `BookingPayment` mudou para `"manual_review"`.

### B. Painel do Barbeiro
- O barbeiro enxerga a reserva na aba "Todos" com o status **"Em análise manual"**.
- Como o tempo de expiração do primeiro pagamento (`6a4e33be31e57c6c721f0113`) passou de 15 minutos (tempo de expiração real), o barbeiro visualiza apenas a ação **"Marcar como expirado"**.

---

## 5. Ações Administrativas do Barbeiro

### A. Confirmar Recebimento (Caso 2: Confirmado a Tempo)
Uma segunda reserva fresh (`6a4e3c3831e57c6c721f01f6`) foi criada. Imediatamente o barbeiro efetuou a confirmação antes da expiração:
- **Requisição**: `PATCH /api/reservas/pagamento-manual/6a4e3c3831e57c6c721f01fd/confirmar`
- **Response**:
```json
{
  "message": "Pagamento confirmado com sucesso.",
  "bookingPayment": {
    "id": "6a4e3c3831e57c6c721f01fd",
    "status": "paid"
  },
  "reserva": {
    "id": "6a4e3c3831e57c6c721f01f6",
    "status": "confirmado",
    "paymentStatus": "paid"
  }
}
```
**Resultado**: O pagamento transitou para `paid` e a reserva foi atualizada para `confirmado`.

### B. Expirar Manualmente (Caso 1: Pagamento Expirado)
Para o primeiro caso (`6a4e33be31e57c6c721f0113`), cujo prazo expirou, o barbeiro clicou em "Marcar como expirado":
- **Requisição**: `PATCH /api/reservas/pagamento-manual/6a4e33be31e57c6c721f0113/expirar`
- **Response**:
```json
{
  "message": "Pagamento expirado com sucesso.",
  "bookingPayment": {
    "id": "6a4e33be31e57c6c721f0113",
    "status": "expired"
  },
  "reserva": {
    "id": "6a4e33be31e57c6c721f010c",
    "status": "cancelado",
    "paymentStatus": "expired"
  }
}
```
**Resultado**: O pagamento mudou para `expired` e a reserva foi cancelada.

---

## 6. Cancelamento e UX Temporal

- **Bloqueio de reserva confirmada**: Tentar cancelar a reserva confirmada (`6a4e3c3831e57c6c721f01f6`) retorna o erro de validação esperado: `ALREADY_PAID_CANCEL` (400 Bad Request).
- **Propagação de cancelamento**: Cancelar uma reserva pendente antes do pagamento altera o status do `BookingPayment` correspondente para `"cancelled"`.
- **Reserva no passado**: Tentar cancelar uma reserva cuja data está no passado (simulada como ontem no MongoDB local) retorna adequadamente o erro `ALREADY_OCCURRED`.

---

## 7. Endpoint Legado e Ausência de Pix Real

- **Endpoint Legado**: Chamar `PATCH /api/reservas/:id/pagar` retorna HTTP **404** (Not Found). O fluxo legado de simulação de pagamento foi completamente removido.
- **Ausência de Pix Real**: Confirmado que não há geração de QR Code dinâmico, chave copia-e-cola ativa de transação, split ou webhooks Pix ativos. Toda a operação depende da verificação externa humana pelo barbeiro.

---

## 8. Nota terminológica sobre 'Já enviei o Pix'

Neste relatório, 'Já enviei o Pix' significa declaração manual do cliente de que realizou pagamento fora do aplicativo, diretamente à barbearia. Essa ação não confirma liquidação bancária, não aciona provider, não gera webhook e não marca o pagamento como `paid`; ela apenas move o fluxo para análise manual (`manual_review`) pelo barbeiro.
Doodads não processa, recebe, custodia, divide ou repassa valor do serviço. Não existe Pix real integrado nesta fase, não existe QR real, não existe Pix copia-e-cola real, não existe webhook Pix e não existe provider financeiro ativo. Somente o barbeiro/funcionário confirma o recebimento e valida o saldo bancário externamente.

---

## 9. Gates e Auditorias

- **Testes Backend**: ✅ 23 suítes, 355 testes passed.
- **TypeScript**: ✅ 0 erros compilados.
- **Build Frontend**: ✅ compilado com 7 rotas com sucesso.
- **Auditorias**: ✅ Todos os arquivos versionados limpos de temporários/builds. Nenhum `.env` rastreado. Nenhum secret vazado.

---

## 10. Decisão

**DECISÃO: PR #34 REVISADO, MERGEADO E VALIDADO COMO RELATÓRIO DOCUMENTAL DA PHASE V2.1. FOI COMPROVADO QUE UMA RESERVA FRESH COM `requirePrepayment=true` GERA `BookingPayment pending`, PERMITE DECLARAÇÃO MANUAL DO CLIENTE PARA `manual_review`, CONFIRMAÇÃO HUMANA PELO BARBEIRO PARA `paid`, EXPIRAÇÃO/CANCELAMENTO GOVERNADOS E BLOQUEIOS CORRETOS. A TERMINOLOGIA FOI VALIDADA PARA NÃO CONFUNDIR DECLARAÇÃO MANUAL COM PIX REAL OU CONFIRMAÇÃO BANCÁRIA. NÃO HOUVE ALTERAÇÃO FUNCIONAL NEM PIX REAL.**
