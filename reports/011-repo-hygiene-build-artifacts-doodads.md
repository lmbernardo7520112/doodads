# Higiene do Repositório: Build Artifacts e Node Modules

## Problema Encontrado
Durante a revisão de PR da Fase 3 (Clean Code Reserva Controller), notou-se a presença ostensiva de milhares de dependências do Node.js (`server/node_modules`) rastreadas (tracked) diretamente no histórico do Git. O versionamento indevido dessas pastas acarreta lentidão nas checagens de diff do GitHub, potencializa ataques por vulnerabilidades supply-chain já que as dependências ficam presas no tempo, e confunde ferramentas de auditoria e revisão.

## Diretórios Rastreados Indevidamente e Arquivos Removidos
- O comando `git ls-files` identificou exatos 1569 itens associados a arquivos de build e módulos no branch, sendo quase a totalidade parte do ecossistema do `server/node_modules/`.
- Todos eles foram limpos do cache do Git usando o comando `git rm -r --cached`. Isso instrui o Git a parar de segui-los sem deletar os diretórios e arquivos fisicamente do disco local (garantindo que o ambiente de desenvolvimento do desenvolvedor não seja quebrado).

## Decisão sobre `node_modules` e Build Artifacts
- **`node_modules`:** Devem SEMPRE ser instalados via `npm install` no destino (local ou CI/CD). Lockfiles (`package-lock.json`) garantem o determinismo das versões. Portanto, nenhum `node_modules` deve permanecer no Git.
- **Build Artifacts:** Arquivos como `.map`, pastas `.next`, `dist`, `build` e `coverage` representam estados efêmeros gerados a partir do código fonte. O tracking deles foi desabilitado globalmente.

## Atualização do `.gitignore`
O `.gitignore` na raiz do projeto (que substitui a necessidade do `.gitignore` esparso em subpastas) foi reescrito para proteger:
- `**/node_modules/`
- `**/dist/`, `**/build/`, `**/.next/`, `*.map`
- `**/coverage/`
- `.env`, `.env.*` (exceto `!.env.example`)
- Arquivos de log e caches diversos.

## Testes e Typescript
Após o processo de untracking, re-rodamos os testes.
- **Comando Executado:** `cd server && npm run test && npx tsc --noEmit`
- **Resultados:** 4 test suites rodados, 15 testes passando.
- **TypeScript:** Compilado com sucesso (0 erros).
Isso certifica que a desvinculação do Git não afeta o comportamento funcional da aplicação.

## Auditoria de Secrets
A auditoria via `grep -RIn` confirmou a inexistência de vazamentos. As chaves residem apenas no `.env` e `.env.test`, que agora estão protegidos firmemente pelo `.gitignore`. Nenhum secret rastreado foi detectado.

## Decisão
**DECISÃO: HIGIENE DO REPOSITÓRIO DOODADS EXECUTADA. NODE_MODULES E ARTEFATOS DE BUILD FORAM REMOVIDOS DO TRACKING, .GITIGNORE FOI CONSOLIDADO, LOCKFILES FORAM PRESERVADOS, TESTES E TYPESCRIPT PERMANECERAM VERDES E NENHUM SECRET FOI VERSIONADO.**
