# Especificação: Pix Booking Payment (Doodads)

## Auditoria do Estado Atual (Gate 2)

**Campos atuais de Reserva:** `status`, `paymentStatus`, `dataHora`, `barbearia`, `servico`, `usuario/cliente`.
**Campos atuais de Barbearia:** `dono`, `serviços`, `dados de recebimento`, `configurações`.
**Fluxo atual de pagamento:** Utiliza Stripe na rota de webhook associado à reserva. O `paymentStatus` é atualizado como "pendente" -> "aprovado". Existe um webhook, mas ele é focado em Stripe.

**Gaps (Lacunas):**
- Não há modelo ou provedor de Pix implementado.
- Não há notion de cobrança temporariamente pendente aguardando pagamento para segurar horário.
- Não há timer de expiração de pagamento.
- Não há aceite formal registrado.
- Não há status de `no_show` ou policy de tolerância de atrasos.
- Não há fluxo de conciliação.

| Objeto | Estado atual | Lacuna Pix | Risco | Decisão futura |
| --- | --- | --- | --- | --- |
| Reserva | Simples (pending/aprovado) | Expiração de pagamento | Horários presos | Criar expiresAt |
| Pagamento | Stripe nativo hardcoded | Falta modelo de provedores | Incompatibilidade | Extrair para BookingPayment |
| Barbearia | Simples | Faltam chaves Pix e Webhooks | Não receber o Pix | Entidade BarbeariaPaymentConfig |
| Política | Inexistente | Sem tolerância ou no-show | Disputas de devolução | Entidade BookingPolicy |
| Aceite | Inexistente | Não há prova de ciência | Processos (CDC/LGPD) | Entidade TermsAcceptance |

## Modelos de Domínio Propostos (Gate 3)

### BarbeariaPaymentConfig
- `barbeariaId`
- `paymentMode`: `manual_pix`, `pix_provider`
- `provider`: `manual`, `banco_api_pix`, `mercado_pago`, `asaas`, `efipay`, `outro`
- `pixKeyMasked`
- `providerAccountRef`
- `credentialRef` (aponta para secret manager/env/provider vault)
- `webhookSecretRef`
- `status`: `pending`, `active`, `disabled`
- `createdAt`, `updatedAt`

### BookingPayment
- `reservaId`, `barbeariaId`
- `provider`, `providerPaymentId`
- `amountCents`
- `currency`: BRL
- `status`: `pending`, `paid`, `expired`, `cancelled`, `refunded`, `failed`, `manual_review`
- `pixQrCodeRef`, `pixCopyPasteRef`
- `expiresAt`, `paidAt`, `refundedAt`
- `webhookEventId`, `idempotencyKey`
- `createdAt`, `updatedAt`

### BookingPolicy
- `barbeariaId`
- `requirePrepayment`
- `paymentExpirationMinutes`
- `arrivalToleranceMinutes`
- `cancellationWindowHours`
- `refundPolicy`, `noShowPolicy`
- `activeTermsVersionId`, `policyVersion`, `activeFrom`

### TermsAcceptance
- `reservaId`, `barbeariaId`, `termsVersionId`
- `acceptedAt`
- `checkboxLabelSnapshot`, `acceptanceTextSnapshot`, `serviceSnapshot`
- `clientIpHash`, `userAgentHash`
- `source`, `locale`

### TermsVersion
- `type`, `version`
- `contentHash`
- `effectiveFrom`, `isActive`

> **Governança:** Credenciais reais nunca ficam no código. `credentialRef` aponta para um cofre seguro. QR/CopyPaste devem minimizar os dados transacionados. Dados pessoais (IP) armazenados como hash.
