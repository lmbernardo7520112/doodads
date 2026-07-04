# Phase D3: BookingPayment Integration in Reserva Flow — Relatório 065

## 1. Objetivo

Integrar de forma backend-only, controlada e TDD-first o `BookingPaymentManualService` ao fluxo de criação de reserva, gerando um `BookingPayment` manual pending somente quando a `BookingPolicy` exigir pré-pagamento (`requirePrepayment = true`), preservando retrocompatibilidade total e o fluxo antigo.

## 2. Arquivos Alterados/Criados

| Arquivo | Ação |
|---|---|
| `server/services/reserva.service.ts` | Modificado — integrado BookingPaymentManualService |
| `server/controllers/reserva.controller.ts` | Modificado — adaptado para repassar BookingPayment |
| `server/tests/reservaManualPaymentIntegration.service.test.ts` | Criado — 5 testes de integração |

## 3. Regra requirePrepayment = false (Fluxo Antigo)

Quando a BookingPolicy ativa da barbearia possuir `requirePrepayment = false`:
- O fluxo antigo de reservas com aceite de termos permanece 100% inalterado;
- Não é criado nenhum BookingPayment no banco de dados;
- A reserva preserva os campos `paymentRequired = false`, `paymentStatus = "pendente"` (default legado) e `bookingPaymentId = undefined`.

## 4. Regra requirePrepayment = true (Fluxo Integrado)

Quando a BookingPolicy ativa possuir `requirePrepayment = true`:
1. **Criação de BookingPayment**: Invoca o `BookingPaymentManualService` para criar um pagamento com:
   - `provider: "manual"`;
   - `status: "pending"`;
   - `amountCents` derivado diretamente do preço real do serviço (`servicoObj.preco`);
   - `currency: "BRL"`;
   - `expiresAt` calculado a partir de `policy.paymentExpirationMinutes`.
2. **Atualização da Reserva**: Registra na `Reserva`:
   - `paymentRequired = true`;
   - `paymentStatus = "pending"`;
   - `bookingPaymentId` apontando para o BookingPayment criado;
   - `paymentExpiresAt` com a mesma expiração do pagamento.
3. **Status de Reserva**: Permanece `"pendente"` (sem confirmação prematura por pagamento).
4. **Retorno do Controller**: O JSON de resposta do endpoint `POST /reservas` passa a incluir `bookingPayment` e `paymentInstruction` com instruções de pagamento Pix.

## 5. Estratégia de Idempotência

O service utiliza uma chave de idempotência baseada no ID da reserva:
`manual-payment-${reserva._id.toString()}`.
Caso a criação seja reexecutada para a mesma reserva, o BookingPaymentManualService retorna de forma segura o registro já existente, garantindo a unicidade do pagamento por reserva.

## 6. Proteção contra Mass Assignment

- O cliente não controla nenhum dos campos de pagamento no body do POST.
- O Zod `.strict()` rejeita campos extras.
- `amountCents` é derivado exclusivamente do preço real do serviço persistido na base de dados (`servicoObj.preco`), neutralizando tentativas de fraude de preço.
- `expiresAt` e `paymentExpiresAt` são gerados server-side com base na policy.

## 7. Testes Criados (5)

Os testes dedicados em `server/tests/reservaManualPaymentIntegration.service.test.ts` cobrem:
1. **requirePrepayment=false**: Garante que o fluxo antigo permanece intacto e não cria nenhum pagamento.
2. **requirePrepayment=true**: Confirma criação do BookingPayment, preenchimento de campos de pagamento na reserva (`paymentRequired`, `paymentStatus = pending`, `bookingPaymentId`, `paymentExpiresAt`) e manutenção do status principal da Reserva como `"pendente"`.
3. **Idempotência**: Verifica que reexecuções seguras sobre a mesma reserva não duplicam a criação de pagamentos.
4. **Valor server-owned**: Garante que tentativas de injetar um preço menor via body/parâmetro são ignoradas e o valor do serviço no banco de dados prevalece.
5. **Esterilidade funcional**: Confirma a total ausência de Pix real, QR Codes dinâmicos ou webhooks nos dados gerados.

## 8. Resultados de Testes e TypeScript

### Execução de Testes
A suíte completa agora passa com **233 testes verdes** distribuídos em **14 suítes**:
```
PASS tests/bookingPaymentManual.service.test.ts
PASS tests/reservaManualPaymentIntegration.service.test.ts
PASS tests/reservaTermsIntegration.service.test.ts
PASS tests/termsAcceptance.service.test.ts
PASS tests/reserva.routes.full.test.ts
PASS tests/termsVersionSeed.service.test.ts
PASS tests/reservaPaymentFields.model.test.ts
PASS tests/bookingPolicy.service.test.ts
PASS tests/pagamento.controller.test.ts
PASS tests/reserva.model.test.ts
PASS tests/reservaContractHardening.schema.test.ts
PASS tests/pix-booking-models.test.ts
PASS tests/paymentStatusPresenter.test.ts

Test Suites: 14 passed, 14 total
Tests:       233 passed, 233 total
Snapshots:   0 total
```

### Compilação TypeScript
```
npx tsc --noEmit
-> TS OK (0 erros de compilação)
```

## 9. Auditorias

| Auditoria | Resultado |
|---|---|
| Artifacts | ✅ Limpo |
| .env | ✅ Limpo (apenas config/env.ts legítimo) |
| Secrets | ✅ Limpo |
| Escopo funcional | ✅ Limpo (sem novas rotas, schemas ou novos controllers) |
| Pix/QR/Webhook/Provider real | ✅ Limpo |
| Confirmação manual | ✅ Limpo |

## 10. Decisão

**DECISÃO: PHASE D3 IMPLEMENTADA COM INTEGRAÇÃO BACKEND CONTROLADA ENTRE RESERVA E BOOKINGPAYMENT MANUAL PENDING, ATIVADA APENAS QUANDO BOOKINGPOLICY.REQUIREPREPAYMENT = TRUE, COM AMOUNTCENTS SERVER-OWNED, EXPIRESAT DERIVADO DA POLICY, PRESERVAÇÃO DO FLUXO ANTIGO QUANDO REQUIREPREPAYMENT = FALSE, SEM FRONTEND, SEM ROTAS NOVAS, SEM CONFIRMAÇÃO MANUAL, SEM PIX REAL, QR REAL, WEBHOOK OU PROVIDER REAL. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
