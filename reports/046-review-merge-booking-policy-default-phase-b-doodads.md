# Revisão e Merge: BookingPolicy Default Phase B

## 1. Estado Inicial do PR #9
- **PR**: #9
- **Título**: feat(payments): add default booking policy service
- **Estado**: OPEN, MERGEABLE
- **Base**: `main` ← `feat/doodads-booking-policy-default-phase-b`
- **Arquivos alterados**: 4 (+175, -0)
- **URL**: https://github.com/lmbernardo7520112/doodads/pull/9

## 2. Arquivos no Diff
- `reports/045-booking-policy-default-phase-b-doodads.md`
- `server/repositories/bookingPolicy.repository.ts`
- `server/services/bookingPolicy.service.ts`
- `server/tests/bookingPolicy.service.test.ts`

## 3. Escopo Validado
O grep de esterilidade (`client/`, `routes/`, `controllers/`, `reserva.service`, `Reserva.ts`) retornou **vazio**. Nenhum fluxo público foi tocado. Nenhum frontend alterado. Nenhum Pix real, webhook, QR real, provider real, `.env` ou secret foi introduzido.

## 4. Análise de Arquitetura
- **Repository** (`bookingPolicy.repository.ts`): Encapsula queries MongoDB (`findActiveByBarbeariaId`, `create`, `deactivateAllForBarbearia`). Segue o mesmo padrão do `reserva.repository.ts` existente.
- **Service** (`bookingPolicy.service.ts`): Contém a lógica de domínio `getActiveOrDefaultPolicy`. Busca policy ativa; se ausente, cria uma default. Double-check antes da inserção para mitigar corrida. O controller permanece fino e sem regra de negócio.
- **Aderência**: Controller → Service → Repository → Model. ✅

## 5. Análise e Deliberação sobre Defaults

### Correção aplicada durante a revisão

Os defaults originais eram:
- `refundPolicy`: `no_refund_after_window`
- `noShowPolicy`: `mark_no_show_after_tolerance`

**Deliberação formal**: Ambos foram considerados **prematuramente agressivos** para um MVP que ainda não possui:
1. Mecanismo de contestação do consumidor.
2. Pix real ativo (logo, não há pagamento a ser retido ou recusado).
3. Validação jurídica frente ao CDC (art. 49 — direito de arrependimento em 7 dias para compras online) e à LGPD.

**Decisão**: Ambos foram corrigidos para `manual_review` antes do merge, que é a postura mais conservadora e que requer decisão humana explícita antes de penalizar qualquer consumidor. Quando o fluxo Pix for ativado em fase futura, a barbearia poderá configurar políticas mais restritivas, mas o default do sistema será sempre a revisão manual.

### Defaults finais integrados:
| Campo | Valor | Justificativa |
|---|---|---|
| `requirePrepayment` | `false` | Sem Pix ativo, sem exigir prepagamento |
| `paymentExpirationMinutes` | `15` | Dentro do range 1-120 do model |
| `arrivalToleranceMinutes` | `15` | Dentro do range 0-60 do model |
| `cancellationWindowHours` | `2` | Dentro do range 0-168 do model |
| `refundPolicy` | `manual_review` | Conservador — requer decisão humana |
| `noShowPolicy` | `manual_review` | Conservador — requer decisão humana |
| `policyVersion` | `1.0` | Versão inicial estável |
| `isActive` | `true` | Policy ativa por definição |

## 6. Análise de Risco de Duplicação Concorrente
O service implementa um double-check (busca → construção de dados → busca novamente → cria somente se ainda ausente). Isso não é atomicamente seguro contra corrida extrema (duas requisições exatas no mesmo milissegundo), mas:
- O repositório utiliza `sort({ createdAt: -1 })` para pegar a última criada em caso de corrida.
- O índice `{ barbeariaId: 1, isActive: 1 }` garante queries eficientes.
- O risco é aceitável para um MVP sem tráfego alto, e pode ser migrado para upsert atômico em fase futura.

## 7. Testes Executados
- **Suítes**: 6 (todas passando)
- **Testes**: 44 (todos passando)
- **Cobertura da Phase B**:
  1. Criação de policy default quando inexistente (com verificação de todos os defaults).
  2. Retorno da policy ativa existente sem duplicação (`countDocuments === 1`).
  3. Respeito aos limites Mongoose (`paymentExpirationMinutes` entre 1 e 120).
- **TypeScript**: `npx tsc --noEmit` — 0 erros.

## 8. Auditoria de Artifacts
- `git ls-files` — nenhum `node_modules`, `dist`, `.next`, `build`, `coverage` ou `.map` rastreado. ✅

## 9. Auditoria de .env/Secrets
- Nenhum `.env` rastreado pelo Git.
- O grep de secrets detectou apenas referências históricas em relatórios anteriores (menções documentais a "defaultsecret" como evidência de remoção) e valores mock em `.env.test` local. Nenhum secret real introduzido pelo PR #9. ✅

## 10. Confirmações Explícitas
- Pix real: ❌ Não ativado
- Webhook: ❌ Não ativado
- QR real: ❌ Não ativado
- Provider real: ❌ Não ativado
- Frontend público: ❌ Não alterado
- Reserva.ts: ❌ Não alterado
- payment_pending: ❌ Não ativado
- Rotas públicas: ❌ Não alteradas
- Controllers: ❌ Não alterados

## 11. Hash do Merge
- **Hash**: `a200bc2`
- **Commit de correção pré-merge**: `82397d3` (alteração de defaults para `manual_review`)

## 12. Decisão

DECISÃO: PR #9 REVISADO, MERGEADO E VALIDADO. BOOKINGPOLICY DEFAULT POR BARBEARIA INTEGRADA COM SERVICE/REPOSITORY E TESTES, SEM ATIVAÇÃO DE PIX REAL, WEBHOOK, QR REAL, PROVIDER REAL, FRONTEND PÚBLICO, PAYMENT_PENDING OU ALTERAÇÃO DO FLUXO DE RESERVAS. DEFAULTS DE REFUNDPOLICY E NOSHOWPOLICY FORAM CORRIGIDOS PARA MANUAL_REVIEW (POSTURA CONSERVADORA) DURANTE A REVISÃO. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.

## 13. Próxima Fase Recomendada
DOODADS-TERMS-VERSION-SEED-PHASE-C — criar um seed/fixture de TermsVersion inicial (booking_payment_terms, cancellation_policy) para que exista uma base de termos aceita pelo usuário no momento da reserva, ainda sem ativar Pix real, webhook, QR real, provider real ou alteração do fluxo público.
