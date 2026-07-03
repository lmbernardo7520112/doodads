# Implementação dos Modelos (Fase A)

Este documento atende ao **Gate 9** da fase `DOODADS-PIX-BOOKING-MODELS-IMPLEMENTATION-PHASE-A`.

## 1. Models Criados
Os seguintes models do Mongoose foram implementados conforme a especificação arquitetural:

- `BookingPayment`: 
  - **Campos**: `reservaId`, `barbeariaId`, `provider`, `amountCents`, `currency`, `status` (pending, paid, etc.), expirações, e `idempotencyKey`.
  - **Enums**: Providers de pagamento e `status`.
  - **Índices**: `reservaId`, `barbeariaId`, composto `status + expiresAt`, `providerPaymentId` (sparse), e `idempotencyKey` (sparse).
  - **Segurança**: Nenhum segredo é retido. Nenhum payload malicioso/puro do provedor é guardado de forma ingênua.

- `BookingPolicy`:
  - **Campos**: Configurações de tolerância, expiração, janelas de cancelamento, políticas de no-show e reembolso.
  - **Índices**: `barbeariaId + isActive` para query eficiente das políticas da vez.

- `TermsVersion`:
  - **Campos**: `type`, `version`, `title`, `content`, `contentHash` e `isActive`.
  - **Índices**: `type + version`, `type + isActive` e `contentHash`.
  
- `TermsAcceptance`:
  - **Campos**: Snapshots da transação no ato da reserva, além de `clientIpHash` e `userAgentHash`.
  - **Regras de Segurança**: Obediência clara a políticas de minimização (LGPD).
  
- `BarbeariaPaymentConfig`:
  - **Campos**: Configuração por barbearia (`manual_pix` ou provedores via API).
  - **Segurança**: Chaves expostas não são salvas (uso de `credentialRef`), máscara obrigatória (`pixKeyMasked`).

## 2. O que NÃO foi ativado
Aderindo estritamente aos gates de não funcionalidade prematura:
- Não foram mexidos controllers, middlewares ou routes.
- A entidade original `Reserva.ts` **não** foi tocada, sendo preservada 100%.
- Nenhum provider real foi inicializado e nenhuma `migration` para o banco de dados ocorreu.
