# FASE D9 (Recuperada): Spec de Contrato Operacional para Consulta/Listagem de Manual Payments

## Objetivo
Especificar contratos futuros para consulta e listagem operacional de pagamentos manuais (manual_pix) pelas barbearias, definindo endpoints, autorização/ownership, filtros, paginação, response seguro, campos permitidos/proibidos, presenters PT-BR, limites financeiros, ameaças e testes obrigatórios.

**Esta é uma fase exclusivamente documental. Nenhuma implementação funcional é realizada.**

## Nota sobre Recuperação
A D9 original deveria ter sido o report 077. Porém, os reports 077/078 foram ocupados por uma Phase E1 funcional executada antes da D9 documental. Esta spec é recuperada como report 079 para restaurar a governança do protocolo sem conflitar com a numeração existente.

---

## Contexto Consolidado (D0-D8)

O módulo de pagamentos manuais foi consolidado em 8 fases:

| Fase | Entrega |
|------|---------|
| D0 | Spec do fluxo controlado manual_pix |
| D1 | Campos de pagamento no Reserva + Payment Status Presenter PT-BR |
| D2 | BookingPaymentManualService (criação com idempotência, sanitização) |
| D3 | Integração Reserva ↔ BookingPayment |
| D4 | Confirmação manual com ownership verification |
| D5 | Rota protegida de confirmação |
| D6 | Expiração de pagamento manual vencido |
| D7 | Rota protegida de expiração |
| D8 | ADR de fronteira arquitetural |

**Estado atual:** 312 testes, 18 suítes, 100% passando. TypeScript sem erros. Auditorias limpas.

**Problema operacional:** O backend permite criar, confirmar e expirar pagamentos manuais. Porém, **não existe contrato para consulta/listagem** operacional. A barbearia não tem como listar pagamentos pendentes, pagos ou expirados. Sem esta spec, há risco de frontend improvisado, vazamento de dados sensíveis e enumeração indevida.

---

## Endpoints Futuros Propostos

### E1: Consultar um pagamento manual por ID

```
GET /api/reservas/pagamento-manual/:bookingPaymentId
```

**Descrição:** Retorna um único BookingPayment por ID, com presenters PT-BR.

**Padrão de rota:** Segue o padrão já estabelecido em `reserva.routes.ts` para operações sobre pagamentos vinculados a reservas.

### E2: Listar pagamentos manuais de uma barbearia

```
GET /api/barbearias/:barbeariaId/pagamentos-manuais
```

**Descrição:** Lista pagamentos manuais da barbearia com filtros, paginação e presenters PT-BR.

**Alternativa considerada:** `GET /api/reservas/pagamentos-manuais?barbeariaId=X` — rejeitada porque o recurso pai é a barbearia, não a reserva genérica.

---

## Autorização e Ownership

### Regras obrigatórias

| Papel | Permissão E1 (consultar) | Permissão E2 (listar) |
|-------|--------------------------|----------------------|
| **cliente** | ❌ Bloqueado | ❌ Bloqueado |
| **barbeiro** | ✅ Apenas se ownership da barbearia | ✅ Apenas barbearia própria |
| **admin** | ✅ Qualquer barbearia | ✅ Qualquer barbearia |
| **sem token** | ❌ 401 Unauthorized | ❌ 401 Unauthorized |

### Regras de implementação (ADR D8)
- Autorização e ownership devem residir no **Application Service**, NÃO no controller.
- Controller permanece fino: valida input (schema) e repassa ao service.
- Nenhum endpoint deve permitir enumeração global sem papel admin.
- Cliente não pode consultar status de pagamentos da barbearia. Em fase futura, se autorizado explicitamente, poderá consultar apenas o status mínimo da própria reserva.

---

## Filtros Permitidos

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| `status` | `string` | Filtrar por status do pagamento (`pending`, `paid`, `expired`, `failed`, `manual_review`, `cancelled`, `refunded`) |
| `reservaId` | `ObjectId` | Filtrar por reserva específica |
| `expiresBefore` | `ISO Date` | Pagamentos que expiram antes de data |
| `expiresAfter` | `ISO Date` | Pagamentos que expiram após data |
| `createdBefore` | `ISO Date` | Criados antes de data |
| `createdAfter` | `ISO Date` | Criados após data |
| `overdueOnly` | `boolean` | Apenas pagamentos pending com expiresAt no passado |
| `manualReviewOnly` | `boolean` | Apenas pagamentos em manual_review |

### Validações de filtros
- `status` deve ser validado contra enum de valores válidos. Status inválido → 400.
- Datas devem ser ISO válidas. Data inválida → 400.
- `overdueOnly=true` implica `status=pending AND expiresAt < now`.
- Filtros operam **sempre dentro do ownership** — barbeiro só filtra pagamentos da sua barbearia.

---

## Filtros Proibidos ou Perigosos

| Filtro proibido | Motivo |
|-----------------|--------|
| Buscar por cliente de outra barbearia | Violação de ownership |
| Buscar globalmente sem papel admin | Enumeração indevida |
| Buscar por dados sensíveis (CPF, CNPJ) | Dados não armazenados / não indexados |
| Buscar por pixKey | Campo proibido, não existe no fluxo manual |
| Buscar por provider payload | Dado interno, não exposto |
| Buscar por metadata bruta | Risco de vazamento |
| Buscar por idempotencyKey | Dado interno (ver exceção abaixo) |

---

## Paginação

| Parâmetro | Valor |
|-----------|-------|
| **Default limit** | 20 |
| **Limite máximo** | 100 |
| **Ordenação padrão** | `createdAt DESC` (mais recentes primeiro) |
| **Ordenações permitidas** | `createdAt`, `expiresAt`, `amountCents` (ASC/DESC) |
| **Página vazia** | Retorna `{ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }` |
| **Filtro inválido** | 400 Bad Request com mensagem descritiva |
| **Bloqueio sem ownership** | 403 Forbidden |
| **Proteção contra enumeração** | Query sem `barbeariaId` válido e sem papel admin → 400 ou 403 |

---

## Response Seguro

### Campos permitidos no response

| Campo | Tipo | Notas |
|-------|------|-------|
| `bookingPaymentId` | `string` | ID do pagamento |
| `reservaId` | `string` | ID da reserva vinculada |
| `barbeariaId` | `string` | Apenas se autorizado (ownership verificado) |
| `amountCents` | `number` | Valor em centavos |
| `currency` | `string` | Sempre "BRL" |
| `paymentStatus` | `string` | Código técnico (campo de API, acompanhado de presentation) |
| `paymentStatusPresentation` | `object` | `{ code, label, description, tone }` via `presentPaymentStatus()` |
| `reservaStatusPresentation` | `object` | `{ code, label, description, tone }` via `presentReservaStatus()`, quando reserva presente |
| `expiresAt` | `ISO Date` | Data de expiração |
| `paidAt` | `ISO Date` | Data de pagamento (se paid) |
| `createdAt` | `ISO Date` | Data de criação |
| `updatedAt` | `ISO Date` | Última atualização |
| `canConfirm` | `boolean` | Flag operacional: `status === "pending" && !expirado` |
| `canExpire` | `boolean` | Flag operacional: `status === "pending" && expiresAt < now` |

**Justificativa para `canConfirm`/`canExpire`:** Permitem que o frontend determine ações disponíveis sem reimplementar regras de domínio. São derivados read-only do estado atual.

### Campos PROIBIDOS no response

| Campo proibido | Motivo |
|----------------|--------|
| `pixKey` | Pix real não implementado |
| `pixQr` / `pixQrCodeRef` | QR Code real não implementado |
| `pixCopyPaste` / `pixCopyPasteRef` | Copia-e-cola real não implementado |
| `copiaECola` | Alias proibido |
| `webhook payload` / `webhookEventId` | Dado interno de infraestrutura |
| `providerPaymentId` | Referência interna do provider |
| `providerPaymentReference` | Referência interna do provider |
| `providerAccount` | Credencial do provider |
| `credentialRef` | Credencial |
| `secret` / `token` | Qualquer segredo |
| `raw metadata` / `metadataSafe` | Pode conter audit trail sensível |
| `idempotencyKey` | Dado interno (salvo decisão explícita futura com justificativa técnica restrita) |
| Dados bancários (conta, agência) | Nunca armazenados |
| CPF/CNPJ | Nunca armazenados neste modelo |

### Uso obrigatório de Presenters PT-BR
- Todo `paymentStatus` deve ser acompanhado de `paymentStatusPresentation` usando `presentPaymentStatus()`.
- Todo `reservaStatus` deve ser acompanhado de `reservaStatusPresentation` usando `presentReservaStatus()`.
- Enums crus **nunca** devem ser o único texto visível ao usuário.
- O frontend deve consumir `presentation.label` e `presentation.description`, não o enum bruto.

---

## Limites Financeiros (ADR D8)

- O Doodads **não intermedia dinheiro** do serviço prestado pela barbearia.
- O Doodads opera como registro de estado operacional.
- **Proibido:** Pix real, QR Code, webhook financeiro, armazenamento de chave Pix bruta, split de pagamento, Stripe Connect, custódia, cobrança real.
- Qualquer integração financeira futura requer fase/ADR específica.

---

## Ameaças e Riscos

| Ameaça | Mitigação |
|--------|-----------|
| Enumeração de pagamentos de outras barbearias | Ownership obrigatório no Application Service |
| Exposição de dados sensíveis (Pix, webhook, provider) | Campos proibidos no response, sanitização |
| Cliente acessando listagem da barbearia | Bloqueio por papel (cliente → 403) |
| Confusão de "manual_pix" com Pix real | Labels PT-BR via presenter, sem referência a QR/copia-e-cola |
| Query sem filtro gerando scan completo | Ownership obrigatório + paginação com limite máximo |
| Admin bypass excessivo | Revisão por fase futura se necessário |
| Reuso de idempotencyKey para enumerar pagamentos | idempotencyKey não exposta no response |

---

## Testes Obrigatórios para Fase de Implementação Futura

### Autenticação e Autorização
- [ ] Sem token → 401 Unauthorized
- [ ] Cliente tentando listar pagamentos da barbearia → 403 Forbidden
- [ ] Barbeiro sem ownership da barbearia → 403 Forbidden
- [ ] Barbeiro proprietário lista com sucesso
- [ ] Admin lista qualquer barbearia

### Paginação e Filtros
- [ ] Paginação respeita limite máximo (100)
- [ ] Status inválido → 400 Bad Request
- [ ] Filtro `overdueOnly=true` retorna apenas pending com expiresAt no passado
- [ ] Filtro `manualReviewOnly=true` retorna apenas manual_review
- [ ] Filtros funcionam apenas dentro do ownership

### Response Seguro
- [ ] Response usa `paymentStatusPresentation` (presenter PT-BR)
- [ ] Response usa `reservaStatusPresentation` quando aplicável
- [ ] Response NÃO contém pixKey, pixQr, pixCopyPaste, webhook, provider, metadataSafe, idempotencyKey
- [ ] Response contém `canConfirm` e `canExpire` flags corretas
- [ ] Query NÃO permite enumeração global sem papel admin

### Integridade
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] Testes existentes continuam verdes
- [ ] Auditorias limpas (artifacts, .env, secrets)

---

## Critérios GO/NO-GO para Implementação Futura

### GO se:
1. Esta spec (079) estiver aprovada e mergeada.
2. A fase de implementação tiver branch dedicada.
3. Todos os testes listados acima estiverem no escopo da implementação.
4. Nenhum campo proibido for exposto no response.
5. Autorização/ownership residir no Application Service (ADR D8).
6. Controllers permanecerem finos.
7. Schemas com `.strict()` para proteção contra mass assignment.
8. Presenters PT-BR usados em todo response público.

### NO-GO se:
1. Qualquer campo proibido for exposto.
2. Autorização implementada no controller em vez do service.
3. Enumeração global permitida sem papel admin.
4. Pix real, QR Code, webhook ou provider implementados sem ADR específica.
5. Testes de segurança omitidos.

---

## Confirmação de Ausência de Implementação Funcional
Esta fase é **exclusivamente documental**. Nenhum endpoint, rota, controller, service, repository, model, schema, presenter, middleware, frontend, UI administrativa, cron, job, scheduler, worker ou lógica funcional foi criado ou alterado por este relatório.

DECISÃO: PHASE D9 DOCUMENTAL RECUPERADA COMO REPORT 079, DEFININDO CONTRATO OPERACIONAL PARA CONSULTA/LISTAGEM DE MANUAL PAYMENTS COM ENDPOINTS FUTUROS, AUTORIZAÇÃO/OWNERSHIP, FILTROS PERMITIDOS/PROIBIDOS, PAGINAÇÃO, RESPONSE SEGURO, CAMPOS PERMITIDOS/PROIBIDOS, PRESENTERS PT-BR, LIMITES FINANCEIROS, AMEAÇAS, TESTES OBRIGATÓRIOS E CRITÉRIOS GO/NO-GO. NENHUMA IMPLEMENTAÇÃO FUNCIONAL REALIZADA.
