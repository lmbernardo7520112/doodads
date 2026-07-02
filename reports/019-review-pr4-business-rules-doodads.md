# Revisão Crítica do PR #4 (Regras de Negócio - Reservas)

## Escopo
A branch `security/doodads-reserva-business-rules-hardening` endereçou o endurecimento das regras de negócio atreladas ao domínio de reservas. 

## Claims Verificados
- **Ownership**: O Controller original bloqueava acessos não logados. O PR cobria listar apenas do próprio. **PENDÊNCIA ENCONTRADA:** Faltavam testes explícitos validando o bloqueio de cancelar ou pagar reservas alheias (`FORBIDDEN_CANCEL` e `FORBIDDEN_PAY`).
- **Status Lifecycle**: Cancelamento de reserva "finalizada" e "aprovada" (paga) estavam testados. **PENDÊNCIA ENCONTRADA:** Faltavam testes validando a dupla-ação (cancelar reserva já cancelada, ou pagar reserva cancelada), ambas lançando `ALREADY_CANCELLED`.
- **Pagamento Duplicado / Conflitos / Datas Passadas**: Já testadas previamente.

## Testes Reais (Pre-Merge)
Antes de aceitar o PR, aplicamos TDD injetando os 4 testes omitidos de status lifecycle e ownership diretamente na branch `security/...` através do arquivo `server/tests/reserva.routes.test.ts`. 

- **Resultado final:** 25 testes (aumento em relação à baseline original). 100% de sucesso.
- **TypeScript:** `npx tsc --noEmit` reportou 0 erros.

## Auditoria e Governança
- `node_modules` estava rastreado indevidamente na sub-branch. A falha foi contida através de um `git rm -r --cached` antes do merge.
- Nenhum dado secreto foi exposto; JWT e chaves Stripe mantiveram-se confidenciais via `.env.example` ou `.env.test`.

## Decisão
**DECISÃO: PR #4 REVISADO. AS PENDÊNCIAS DE TESTES RELATIVAS A OWNERSHIP E STATUS LIFECYCLE FORAM REVISADAS E OS TESTES ADICIONADOS. O CÓDIGO DA BRANCH COMPROVOU IMPLEMENTAR OS CÓDIGOS CORRETOS (`FORBIDDEN_CANCEL`, `ALREADY_CANCELLED`, ETC) RETORNANDO HTTP 403 E 400 DE FORMA ESTRITA E SEM DEPENDER DIRETAMENTE DE CAMADA HTTP NO REPOSITÓRIO. GO PARA MERGE!**
