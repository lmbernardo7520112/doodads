# FASE R1: Protocol Recovery — D9 Documental + Style Correction

## Diagnóstico do Desvio

### O que deveria ter acontecido após D8:
Após a Phase D8 (ADR de fronteira arquitetural), a próxima fase prevista era **D9 documental**: uma spec de contrato operacional para consulta/listagem de pagamentos manuais, **sem qualquer implementação funcional**.

### O que aconteceu:
Foi executada uma **Phase E1 funcional** que:
1. Criou um novo endpoint backend (`GET /api/terms/active` em `server/routes/terms.routes.ts`).
2. Registrou a rota em `server/index.ts`.
3. Reescreveu `client/components/ui/ReservaModal.tsx` com lógica de termos + pagamento.
4. Reescreveu `client/components/ui/AppointmentCard.tsx` com 10 status de pagamento.
5. Alterou `client/types/Reserva.ts` com campos de pagamento.
6. Alterou `client/app/home/page.tsx` e `client/app/reservas/page.tsx` com callbacks.
7. Corrigiu bug pré-existente em `client/app/pagamento-sucesso/page.tsx` (Suspense boundary).
8. Criou reports 077 e 078, ocupando a numeração reservada para D9.
9. Mergeou para main via PR #25.

### Comparação D9 exigida vs E1 executada:

| Aspecto | D9 (exigida) | E1 (executada) |
|---------|--------------|----------------|
| Tipo | Documental | Funcional |
| Alterações em server/ | Nenhuma | Novo endpoint + rota |
| Alterações em client/ | Nenhuma | 5 arquivos reescritos/alterados |
| Report | 077 | 077 (conflito) + 078 |
| Implementação funcional | Proibida | Realizada |
| Branch padrão | `docs/...` | `feat/...` |
| Auditorias de segurança | Obrigatórias | Não executadas |

## Decisão sobre E1

### Preservado (funcionalidade útil, sem risco de segurança):
- `GET /api/terms/active` — endpoint público sem dados sensíveis.
- Lógica de termos no ReservaModal — tecnicamente correta e alinhada com TermsVersion/TermsAcceptance.
- 10 status de pagamento no AppointmentCard — necessários para o fluxo manual_pix.
- Botão de cancelamento funcional.
- Correção do bug Suspense em pagamento-sucesso.
- Campos de pagamento em `IReserva`.
- Callbacks onUpdate para SWR.

### Não revertido:
A E1 **não foi revertida** porque:
1. Build, TypeScript e 312 testes permanecem verdes.
2. A funcionalidade implementada é coerente com o backend D0-D8.
3. Não há vazamento de dados sensíveis.
4. A ADR D8 é respeitada (controllers finos, presenters, ownership no service).
5. Reverter destruiria funcionalidade útil sem ganho de segurança.

## Correções Visuais Aplicadas (Escopo Mínimo)

### ReservaModal.tsx
| Aspecto | Antes (E1) | Depois (R1) | Justificativa |
|---------|-----------|-------------|---------------|
| Botão Confirmar | `bg-emerald-600` | `bg-black` | Padrão original do design system |
| Botão "Entendi, vou pagar" | `bg-emerald-600` | `bg-black` | Idem |
| Slot selecionado | `bg-emerald-600 border-emerald-600` | `bg-black border-black` | Padrão original |
| Input date focus | `focus:ring-emerald-500` | Removido (sem focus ring, padrão original) | Padrão original |
| Checkbox termos | `text-emerald-600 focus:ring-emerald-500` | `text-black focus:ring-black` | Alinhamento |
| Link termos | `text-emerald-600` | `text-black` | Alinhamento |
| Ícone sucesso | `emerald-100/emerald-600` | `green-100/green-600` | Alinhamento com `text-green-600` do design system |
| `disabled:opacity` | `disabled:opacity-50 disabled:cursor-not-allowed` | `disabled:opacity-60` | Padrão original |

### AppointmentCard.tsx
| Aspecto | Antes (E1) | Depois (R1) | Justificativa |
|---------|-----------|-------------|---------------|
| Status "Confirmado" | `text-emerald-600`, label "Confirmada" | `text-green-600`, label "Confirmado" | Padrão original |
| Status "Pendente" | `text-amber-600` | `text-yellow-600` | Padrão original |
| Card container | `p-4 border border-gray-100` | `p-3` (sem border) | Padrão original |
| `flex-1` wrapper | `min-w-0` adicionado | Removido | Padrão original |
| Payment tones (aprovado/paid) | `emerald-600/emerald-50` | `green-600/green-50` | Alinhamento |

### Não alterado (E1 melhorias neutras preservadas):
- `truncate` nos textos — melhoria de UX sem divergência visual.
- Status de pagamento `amber` para `pendente`/`pending`/`manual_review` — são status novos que não existiam no original, então não há referência anterior a restaurar.

## Arquivos Alterados nesta Phase R1

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `client/components/ui/ReservaModal.tsx` | Correção visual (7 pontos) |
| `client/components/ui/AppointmentCard.tsx` | Correção visual (5 pontos) |
| `reports/079-spec-manual-payments-operational-query-contract-phase-d9-recovery-doodads.md` | CRIADO (D9 documental recuperada) |
| `reports/080-protocol-recovery-d9-style-correction-phase-r1-doodads.md` | CRIADO (este relatório) |

## Confirmações

### Report 077/078 ocupados:
- `reports/077-frontend-integration-manual-payment-phase-e1-doodads.md` — Phase E1 funcional.
- `reports/078-review-merge-frontend-integration-phase-e1-doodads.md` — Merge da E1.
- Não foram removidos nem renumerados. A D9 foi criada como report 079.

### Endpoint funcional criado antes da spec:
- `GET /api/terms/active` foi criado pela E1 antes da spec D9.
- Este endpoint **não é de consulta/listagem de manual payments** — é de busca de TermsVersion ativa.
- A spec D9 (report 079) cobre os endpoints de consulta de manual payments que **ainda não foram implementados**.

### Alteração em server/:
- A E1 criou `server/routes/terms.routes.ts` e alterou `server/index.ts`.
- Esta Phase R1 **não alterou nenhum arquivo em server/**.

## Auditorias Executadas

### TypeScript Backend
```
cd server && npx tsc --noEmit
```
**Resultado:** 0 erros.

### Testes Backend
```
cd server && npm run test
```
**Resultado:** Test Suites: 18 passed, 18 total. Tests: 312 passed, 312 total. Time: 10.72s.

### Build Frontend
```
cd client && npx next build
```
**Resultado:** Build successful. Todas as rotas compiladas. 0 erros de tipo.

### Auditoria de Artifacts
```
git ls-files | grep -E '(^|/)node_modules/|(^|/).next/|(^|/)dist/|(^|/)build/|(^|/)coverage/|.map$' || true
```
**Resultado:** Limpo. Nenhum artefato proibido.

### Auditoria de .env
```
git ls-files | grep -E '(^|/).env$|(^|/).env.' || true
```
**Resultado:** Limpo. Nenhum .env commitado.

### Auditoria de Secrets
```
grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=build --exclude-dir=coverage --exclude-dir=.git 'PIX.*SECRET=.*|PIX.*KEY=.*|STRIPE_SECRET_KEY=.*|STRIPE_WEBHOOK_SECRET=.*|JWT_SECRET=.*|mongodb+srv://|DATABASE_URL=.*|defaultsecret|eyJ' . || true
```
**Resultado:** Apenas referências em reports documentais existentes (esperado). Nenhuma credencial exposta.

### Auditoria de Escopo
```
git diff --name-only HEAD
```
**Resultado:** Apenas `client/components/ui/AppointmentCard.tsx` e `client/components/ui/ReservaModal.tsx` (correções visuais). Nenhuma alteração em `server/`.

## Decisão GO / NO-GO

DECISÃO: PHASE R1 IMPLEMENTADA COMO RECUPERAÇÃO DE GOVERNANÇA. O DESVIO ENTRE D9 DOCUMENTAL EXIGIDA E E1 FUNCIONAL EXECUTADA FOI DOCUMENTADO, A SPEC D9 FOI RECUPERADA NO REPORT 079, AS INCONSISTÊNCIAS VISUAIS FORAM CORRIGIDAS COM ESCOPO MÍNIMO, FUNCIONALIDADES ÚTEIS NÃO FORAM DESTRUÍDAS SEM NECESSIDADE, NENHUMA NOVA FEATURE FOI INTRODUZIDA, TESTES, TYPESCRIPT, BUILD FRONTEND E AUDITORIAS PERMANECEM VERDES.
