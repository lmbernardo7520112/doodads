# Relatório 077: Phase E1 — Frontend Integration com Manual Payment Flow

## Objetivo da Fase
Integrar o frontend (Next.js) com o backend de pagamento manual (manual_pix D0-D8), permitindo que o fluxo de reserva inclua aceite de termos, instruções de pagamento e estados de pagamento corretos, além de funcionalidade de cancelamento.

## Alterações Realizadas

### Backend — Novo Endpoint

#### `server/routes/terms.routes.ts` (NOVO)
- **`GET /api/terms/active?type=booking_payment_terms`** — Endpoint público (sem auth) para o frontend buscar a TermsVersion ativa.
- Retorna: `_id`, `type`, `version`, `title`, `content`, `effectiveFrom`.
- **`contentHash` omitido** da resposta por segurança.
- Validação de `type` contra lista de valores válidos.

#### `server/index.ts` (MODIFICADO)
- Registrada a rota `app.use("/api/terms", termsRoutes)`.

### Frontend — Componentes Atualizados

#### `client/components/ui/ReservaModal.tsx` (REESCRITO)
1. Busca `TermsVersion` ativa ao abrir o modal (`GET /api/terms/active`).
2. Exibe checkbox de aceite com texto expansível dos termos.
3. Envia `acceptedTerms` no payload da reserva quando termos estão disponíveis.
4. Após criação, se `bookingPayment` existir na resposta, exibe **tela de instrução de pagamento** com:
   - Status da reserva (PT-BR).
   - Instrução de pagamento Pix manual.
   - Tempo de expiração.
   - Valor formatado em R$.
5. Retrocompatível: se termos não existem, funciona sem checkbox.

#### `client/components/ui/AppointmentCard.tsx` (REESCRITO)
1. **Removido Stripe Checkout** — Não redireciona mais para Stripe.
2. **10 estados de pagamento** mapeados para labels PT-BR com ícones e cores semânticas.
3. Exibe **countdown de expiração** para pagamentos `pending`.
4. Exibe **motivo de cancelamento** quando disponível.
5. **Botão "Cancelar Reserva"** funcional com `PATCH /reservas/:id/cancelar`.
6. Callback `onUpdate` para re-fetch do SWR após ação.

#### `client/types/Reserva.ts` (ATUALIZADO)
- Adicionados campos: `paymentRequired`, `paymentStatus` (enum completo), `paymentExpiresAt`, `bookingPaymentId`, `confirmedAt`, `cancelReason`.

#### `client/app/home/page.tsx` (ATUALIZADO)
- Passa `onUpdate={() => mutateReservas()}` para `AppointmentCard`.

#### `client/app/reservas/page.tsx` (ATUALIZADO)
- Passa `onUpdate={() => mutate()}` para `AppointmentCard`.

## Contratos de Segurança Mantidos
- **Não há Pix real**: Fluxo manual apenas registra estado.
- **Mass assignment protection**: Schema Zod `criarReservaSchema` com `.strict()` e `acceptedTermsSchema` com `.strict()` já existem e continuam ativos.
- **Rate limiting**: Mantido (20 req/15min para criação de reservas).
- **Ownership/Autorização**: Inalterado no backend.
- **Controllers finos**: Nenhuma regra de negócio adicionada aos controllers (ADR D8 respeitada).

## Arquivos Criados/Modificados
| Arquivo | Ação |
|---------|------|
| `server/routes/terms.routes.ts` | CRIADO |
| `server/index.ts` | MODIFICADO (import + registro de rota) |
| `client/types/Reserva.ts` | MODIFICADO (campos de pagamento) |
| `client/components/ui/ReservaModal.tsx` | REESCRITO |
| `client/components/ui/AppointmentCard.tsx` | REESCRITO |
| `client/app/home/page.tsx` | MODIFICADO (onUpdate callback) |
| `client/app/reservas/page.tsx` | MODIFICADO (onUpdate callback) |

## Correção Adicional: Bug Pré-existente
- **`client/app/pagamento-sucesso/page.tsx`** — `useSearchParams()` sem Suspense boundary. Corrigido adicionando wrapper `<Suspense>` conforme exigido pelo Next.js 15.

## Validações

### TypeScript Backend
```
cd server && npx tsc --noEmit
```
**Resultado:** 0 erros de compilação.

### Testes Backend
```
cd server && npm run test
```
**Resultado:** Test Suites: 18 passed, 18 total. Tests: 312 passed, 312 total. Time: 19.459s.

### Build Frontend
```
cd client && npx next build
```
**Resultado:** Build successful. Todas as rotas compiladas:
- `/` — 2.54 kB
- `/home` — 3.03 kB
- `/login` — 2.42 kB
- `/pagamento-sucesso` — 3.13 kB
- `/register` — 2.13 kB
- `/reservas` — 490 B
- `/barbearia/[id]` — 20.8 kB (Dynamic)

## Metadados do Commit
- **Branch:** `feat/doodads-frontend-integration-phase-e1`
- **Hash:** `ea094eb`

## Decisão GO / NO-GO
**GO.** Phase E1 implementada com:
1. ✅ TypeScript backend: 0 erros.
2. ✅ Testes backend: 312/312 passando (18 suítes).
3. ✅ Build frontend: Sucesso em todas as rotas.
4. ✅ ADR D8 respeitada: Sem regras de negócio em controllers, sem Pix real.
5. ✅ Contratos de segurança mantidos: Rate limiting, Zod validation, ownership.

DECISÃO: PHASE E1 FRONTEND INTEGRATION IMPLEMENTADA. RESERVAMODAL AGORA BUSCA TERMSVERSION ATIVA, EXIBE CHECKBOX DE ACEITE EXPANSÍVEL E ENVIA ACCEPTEDTERMS NO PAYLOAD. PÓS-RESERVA EXIBE INSTRUÇÃO DE PAGAMENTO PIX MANUAL COM VALOR E EXPIRAÇÃO. APPOINTMENTCARD REESCRITO COM 10 STATUS DE PAGAMENTO PT-BR, BOTÃO DE CANCELAMENTO FUNCIONAL, COUNTDOWN DE EXPIRAÇÃO E EXIBIÇÃO DE MOTIVO DE CANCELAMENTO. ENDPOINT GET /API/TERMS/ACTIVE CRIADO. BUG PRÉ-EXISTENTE DE SUSPENSE BOUNDARY CORRIGIDO. TESTES, TYPESCRIPT E BUILD PERMANECEM VERDES.
