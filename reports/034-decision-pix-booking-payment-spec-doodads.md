# Decisão: Especificação do Booking Payment e Pix (Doodads)

## Conciliação e Disputas (Gate 10)
Rotinas sistêmicas necessárias futuramente para garantir a saúde do negócio:
- **Conciliação:** Comparar a tabela `BookingPayment` com chamadas/reports do provedor Pix. Identificar: pendentes vencidos que não expiraram, status 'paid' cuja reserva não confirmou, divergências de centavos e os casos de `manual_review`.
- **Disputas:** Mitigadas utilizando `eventId` únicos, registros de snapshot do `TermsAcceptance`, histórico de ações com timestamp. Casos como pagamento tardio (após o Pix expirar no provedor) vão para `manual_review`.

## Matriz de Riscos (Gate 11)

| Risco | Severidade | Mitigação | Fase de Tratamento |
| --- | --- | --- | --- |
| Pagamento tardio | Média | Enviar para `manual_review` via webhook | Webhook/Conciliação |
| Webhook duplicado | Alta | Usar `idempotencyKey` e ignorar repetições | Webhook |
| Cliente No-show | Média | Aceite explícito de que não há estorno nesses casos | Checkout (TermsAcceptance) |
| Horário preso | Alta | Cronjob de expiração em 15 min (`expirePendingPayments`) | Job Service |
| Credenciais da Barbearia expostas | Crítica | Não versionar, usar Vault e Hash | Modelo (BarbeariaPaymentConfig) |

## DECISÃO FINAL (Gate 13)

DECISÃO: PIX BOOKING PAYMENT FOI ESPECIFICADO SEM IMPLEMENTAÇÃO REAL. O MODELO RECOMENDADO É PIX COBRANÇA/QR DINÂMICO PELO PROVEDOR DA PRÓPRIA BARBEARIA, COM FALLBACK MANUAL TEMPORÁRIO. RESERVAS SERÃO CRIADAS COMO PAYMENT_PENDING, CONFIRMADAS APÓS PAGAMENTO, EXPIRADAS SE NÃO HOUVER PAGAMENTO NO PRAZO E TRATADAS COMO MANUAL_REVIEW EM CASOS DE PAGAMENTO TARDIO OU DISPUTA. ACEITE EXPLÍCITO DOS TERMOS DE PAGAMENTO, TOLERÂNCIA, CANCELAMENTO E NO-SHOW É OBRIGATÓRIO ANTES DA COBRANÇA. NENHUMA INTEGRAÇÃO REAL OU COBRANÇA FOI ATIVADA.
