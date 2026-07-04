# Phase D2: BookingPayment Service Manual Pending — Relatório 063

## 1. Objetivo

Implementar service e repository isolados para a criação de `BookingPayment` manual pending, sem integrar ainda ao fluxo de reserva, sem criar rotas, sem frontend, sem confirmação manual e sem alterar Reserva.ts. Esta fase prepara o domínio de pagamento de forma testada, robusta e segura.

## 2. Arquivos Criados/Alterados

| Arquivo | Ação |
|---|---|
| `server/repositories/bookingPayment.repository.ts` | Criado |
| `server/services/bookingPaymentManual.service.ts` | Criado |
| `server/tests/bookingPaymentManual.service.test.ts` | Criado |

## 3. Contrato Técnico Interno

### `createManualBookingPayment(input)`

O serviço recebe os seguintes campos de entrada:
```typescript
interface CreateManualBookingPaymentInput {
  reservaId: string;
  barbeariaId: string;
  amountCents: number;
  expiresAt: Date;
  idempotencyKey?: string;
  metadataSafe?: Record<string, unknown>;
}
```

E retorna uma `Promise<IBookingPayment>` contendo o pagamento persistido em estado `pending`.

## 4. Validações Implementadas

1. **Validação de ID**: Ambos `reservaId` e `barbeariaId` devem ser válidos sob `mongoose.Types.ObjectId.isValid()`.
2. **Validação de Valor**: `amountCents` deve ser obrigatoriamente um número inteiro positivo maior que zero (`Number.isInteger(amountCents) && amountCents > 0`).
3. **Validação de Prazo**: `expiresAt` deve ser uma data válida e localizada estritamente no futuro (`expiresAt.getTime() > Date.now()`).
4. **Campos Server-Owned**: `provider` é forçado internamente para `"manual"`, `currency` para `"BRL"` e `status` inicial para `"pending"`.

## 5. Estratégia de Idempotência

Se uma `idempotencyKey` for fornecida no input:
- O serviço consulta a base de dados em busca de um pagamento existente com essa chave.
- Se encontrado, verifica se os campos críticos (`reservaId`, `barbeariaId` e `amountCents`) coincidem:
  - Se coincidirem, retorna de forma idempotente o pagamento já existente, sem criar duplicadas.
  - Se algum campo divergir (ex: reuso da mesma chave para valores ou reservas diferentes), rejeita a operação com erro de conflito (`409 CONFLICT`, código `"IDEMPOTENCY_CONFLICT"`).
- Se não encontrado, prossegue para criar um novo registro.

## 6. Estratégia de Sanitização do `metadataSafe`

Para evitar que chaves Pix brutas, secrets, tokens, CPFs, CNPJs, dados bancários ou outras informações sensíveis sejam persistidas:
- O serviço aplica uma sanitização profunda recursiva no objeto `metadataSafe`.
- Qualquer chave que corresponda à regex de termos sensíveis (case-insensitive) é filtrada e removida:
  ```regex
  /(key|secret|token|password|pix|cpf|cnpj|card|cvv|conta|banco|agency|agencia)/i
  ```
- Apenas metadados considerados seguros e que não correspondam aos padrões acima são persistidos.

## 7. Testes Criados (12)

Os testes dedicados em `server/tests/bookingPaymentManual.service.test.ts` cobrem:
1. **Criação Válida**: Cria pagamento manual pendente com parâmetros e metadados válidos.
2. **reservaId inválido**: Rejeita IDs malformatados.
3. **barbeariaId inválido**: Rejeita IDs malformatados.
4. **amountCents zero**: Rejeita valores nulos.
5. **amountCents negativo**: Rejeita valores negativos.
6. **amountCents decimal**: Rejeita valores decimais/não-inteiros.
7. **expiresAt passado**: Rejeita prazos expirados.
8. **expiresAt inválido**: Rejeita formatos de data inválidos.
9. **Sanitização de metadados**: Confirma remoção de campos sensíveis (como `pixKey`, `stripe_secret`, `clientCpf`, etc.) incluindo objetos aninhados.
10. **Idempotência (sucesso)**: Retorna o mesmo registro para chaves de idempotência idênticas.
11. **Conflito de idempotência**: Bloqueia reuso de chave com parâmetros diferentes.
12. **Isolamento de Reserva**: Garante que nenhuma operação interaja, altere ou crie documentos no model de Reserva.

## 8. Resultados de Testes e TypeScript

### Execução de Testes
A suíte completa do Doodads agora passa com sucesso em **228 testes** em **13 suítes**:
```
PASS tests/bookingPaymentManual.service.test.ts
PASS tests/reservaTermsIntegration.service.test.ts
PASS tests/termsAcceptance.service.test.ts
PASS tests/termsVersionSeed.service.test.ts
PASS tests/reservaPaymentFields.model.test.ts
PASS tests/bookingPolicy.service.test.ts
PASS tests/reserva.routes.full.test.ts
PASS tests/paymentStatusPresenter.test.ts
PASS tests/pagamento.controller.test.ts
PASS tests/reserva.model.test.ts
PASS tests/reservaContractHardening.schema.test.ts
PASS tests/pix-booking-models.test.ts

Test Suites: 13 passed, 13 total
Tests:       228 passed, 228 total
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
| Escopo funcional | ✅ Limpo (sem alteração em rotas, controllers, schemas, frontend ou Reserva.ts) |
| Ativação funcional | ✅ Limpo (sem ativação no fluxo real de criação de reservas) |

## 10. Decisão

**DECISÃO: PHASE D2 IMPLEMENTADA COM SERVICE/REPOSITORY ISOLADO PARA BOOKINGPAYMENT MANUAL PENDING, COM VALIDAÇÕES, SANITIZAÇÃO E TESTES DEDICADOS, SEM INTEGRAÇÃO AO FLUXO DE RESERVA, SEM FRONTEND, SEM ROTAS, SEM RESERVA.SERVICE, SEM RESERVA.TS, SEM PAYMENT_PENDING ATIVO, SEM PIX REAL, WEBHOOK, QR REAL OU PROVIDER REAL. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.**
