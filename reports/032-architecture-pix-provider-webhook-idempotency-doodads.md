# Arquitetura: Provedor Pix, Webhook e Idempotência (Doodads)

## Fluxo Pix Manual Temporário (Gate 4)

O MVP inicial pode necessitar de um fluxo manual:
1. Cliente escolhe serviço e horário.
2. Sistema exibe resumo + termos.
3. Cliente aceita termos.
4. Reserva é criada como `payment_pending`.
5. Sistema mostra chave Pix/QR estático da barbearia ou instruções.
6. Cliente paga fora do app.
7. Proprietário confirma manualmente pagamento.
8. Reserva vira `confirmed`.

**Decisão:** Permitido apenas como MVP controlado, tem risco de fraude e atraso operacional. Deverá conter aviso claro e não é a solução definitiva.

## Fluxo Pix Cobrança / QR Dinâmico Alvo (Gate 5)

A arquitetura final:
1. Cliente seleciona serviço/hora.
2. Validação de disponibilidade.
3. Exibição de resumo + termos.
4. Cliente aceita termos.
5. Reserva criada como `payment_pending`.
6. Doodads solicita cobrança ao provedor Pix da barbearia (valor, vencimento curto, identificador, metadata segura).
7. Exibição do QR Code/Pix Copia e Cola.
8. Webhook do provedor confirma pagamento.
9. Doodads valida evento e atualiza `BookingPayment` para `paid`.
10. Reserva vira `confirmed`.
11. Se expirar, reserva vira `expired`.

**Regras:** Pagamento direto à barbearia; Doodads não recebe valor do serviço; Webhook idempotente; Webhook duplicado ignorado.

## Especificação do Webhook Futuro (Gate 6)

Um webhook genérico deverá:
- Validar assinatura do provedor e timestamp.
- Validar `providerPaymentId`, `idempotencyKey/webhookEventId`.
- Buscar `BookingPayment` por `providerPaymentId`.
- Comparar `amountCents` e `status`.
- Evento duplicado retorna 200 idempotente.
- Evento inválido retorna 400. Erro temporário retorna 500 controlado.
- Logs limpos, sem payload sensível.

**Máquina de estados permitida pelo webhook:**
- `pending` → `paid`
- `pending` → `expired`
- `paid` + evento duplicado → `paid`
- `expired` + pagamento tardio → `manual_review`
- `cancelled` + pagamento tardio → `manual_review`
- `refunded` → (não alterar)
