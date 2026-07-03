# Dicionário de Dados: Pix Booking Payment, Policy e Terms

Este documento atende aos **Gates 3, 4, 5, 6 e 7** da fase `DOODADS-PIX-BOOKING-DOMAIN-MODELS-SPEC`. Ele define a estrutura dos novos modelos.

## 1. BookingPayment (Gate 3)
Registra a tentativa de pagamento.

**Campos:**
- `_id`: ObjectId
- `reservaId`: ObjectId (Ref: Reserva)
- `barbeariaId`: ObjectId (Ref: Barbearia)
- `provider`: string
- `providerPaymentId`: string
- `providerPaymentReference`: string
- `amountCents`: number (Inteiro positivo)
- `currency`: string (Default: 'BRL')
- `status`: enum (`pending`, `paid`, `expired`, `cancelled`, `refunded`, `failed`, `manual_review`)
- `pixQrCodeRef`: string
- `pixCopyPasteRef`: string
- `expiresAt`: Date
- `paidAt`: Date
- `refundedAt`: Date
- `failedAt`: Date
- `webhookEventId`: string
- `idempotencyKey`: string
- `metadataSafe`: Schema.Types.Mixed
- `createdAt`: Date
- `updatedAt`: Date

**Regras e Índices:**
- Índices em `reservaId`, `barbeariaId`, `providerPaymentId`, `idempotencyKey`, e `status + expiresAt`.
- Nenhum secret salvo. Pagamento duplicado barreado por `idempotencyKey`. Pagamentos efetuados após `expiresAt` vão para `manual_review`.

## 2. BookingPolicy (Gate 4)
Guarda as regras da barbearia.

**Campos:**
- `_id`: ObjectId
- `barbeariaId`: ObjectId (Ref: Barbearia)
- `requirePrepayment`: boolean
- `paymentExpirationMinutes`: number
- `arrivalToleranceMinutes`: number
- `cancellationWindowHours`: number
- `refundPolicy`: enum (`full_refund_until_window`, `partial_refund_until_window`, `no_refund_after_window`, `manual_review`)
- `noShowPolicy`: enum (`mark_no_show_after_tolerance`, `manual_review`)
- `policyVersion`: number
- `activeFrom`: Date
- `activeUntil`: Date
- `isActive`: boolean
- `createdAt`: Date
- `updatedAt`: Date

**Regras:**
- Apenas uma policy ativa por barbearia. Snapshot na reserva protege reservas antigas.

## 3. TermsVersion (Gate 5)
Versiona os textos legais para o cliente.

**Campos:**
- `_id`: ObjectId
- `type`: enum (`booking_payment_terms`, `cancellation_policy`, `no_show_policy`, `privacy_policy`)
- `version`: string (Ex: '1.0.0')
- `title`: string
- `content`: string
- `contentHash`: string (SHA-256)
- `effectiveFrom`: Date
- `isActive`: boolean
- `createdAt`: Date
- `updatedAt`: Date

**Regras:**
- Modificação cria nova versão, garantindo trilha de auditoria.

## 4. TermsAcceptance (Gate 6)
Evidência de aceite.

**Campos:**
- `_id`: ObjectId
- `reservaId`: ObjectId (Ref: Reserva)
- `barbeariaId`: ObjectId (Ref: Barbearia)
- `userId`: ObjectId (Ref: User, opcional se convidado)
- `termsVersionId`: ObjectId (Ref: TermsVersion)
- `acceptedAt`: Date
- `checkboxLabelSnapshot`: string
- `acceptanceTextSnapshot`: string
- `serviceSnapshot`: 
  - `servicoNome`: string
  - `priceCents`: number
  - `scheduledAt`: Date
  - `durationMinutes`: number
  - `arrivalToleranceMinutes`: number
  - `paymentExpirationMinutes`: number
  - `cancellationWindowHours`: number
  - `refundPolicySummary`: string
  - `noShowPolicySummary`: string
- `clientIpHash`: string
- `userAgentHash`: string
- `source`: enum (`web`, `mobile`, `admin`)
- `locale`: string
- `createdAt`: Date

**Regras e Índices:**
- LGPD: Hashes de IP/User-Agent, não textos puros.
- Índices: `reservaId`, `barbeariaId`, `termsVersionId`, `acceptedAt`.

## 5. BarbeariaPaymentConfig (Gate 7)
Configura provedor e modo de pagamento.

**Campos:**
- `_id`: ObjectId
- `barbeariaId`: ObjectId (Ref: Barbearia)
- `paymentMode`: enum (`manual_pix`, `pix_provider`)
- `provider`: enum (`manual`, `banco_api_pix`, `mercado_pago`, `asaas`, `efipay`, `outro`)
- `pixKeyMasked`: string
- `providerAccountRef`: string
- `credentialRef`: string (Aponta para KMS/Vault, nunca em texto claro)
- `webhookSecretRef`: string
- `status`: enum (`pending`, `active`, `disabled`)
- `createdAt`: Date
- `updatedAt`: Date
