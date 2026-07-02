# Arquitetura: Confirmação de Reserva via Pix Direto (Doodads)

## O Problema do Modelo Anterior (Stripe Connect/Split)
Se o Doodads recebesse o valor do cliente para repassar à barbearia, operaríamos como subadquirente, exigindo licenças pesadas, lidando com chargebacks e tributação cruzada.

## Nova Solução Recomendada: Pagamento Direto
1. **Pix Direto à Barbearia:** O cliente agenda o serviço e realiza o pagamento via **Pix Cobrança / QR Code dinâmico**. O provedor de Pix é vinculado diretamente à conta bancária da própria barbearia (entidade `BarbeariaPaymentConfig`).
2. **Reserva Condicionada (`payment_pending`):** O agendamento nasce no status `payment_pending`. A cobrança Pix tem validade curta (ex: 15 minutos).
3. **Webhook de Confirmação:** O provedor de Pix da barbearia aciona o webhook do Doodads informando o sucesso. O status transita de `payment_pending` para `confirmed` e `paymentStatus` para `paid`.
4. **Expiração (`expired`):** Se o Pix não for pago dentro do limite, a cobrança e a reserva expiram simultaneamente, liberando o horário para outros clientes.
5. **Sem Split de Pagamento:** Como o Doodads cobra apenas a mensalidade SaaS, o valor do serviço pago pelo cliente vai 100% livre para a barbearia, minimizando custos de processamento.
