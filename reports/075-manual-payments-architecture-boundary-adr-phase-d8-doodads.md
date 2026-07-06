# FASE D8: Doodads Manual Payments Architecture Boundary ADR

## Objetivo da Fase
Criar uma ADR curta, rigorosa e profissional definindo a fronteira arquitetural do módulo manual payments antes de qualquer nova expansão funcional, consolidando as decisões D0-D7, classificando responsabilidades por camada, explicitando limites financeiros, definindo regras para autorização/ownership e registrando diretrizes para evolução futura.

## Arquivos Documentais Criados
* `reports/075-manual-payments-architecture-boundary-adr-phase-d8-doodads.md` (Este arquivo atua como ADR e relatório da fase).

## Síntese da Decisão Arquitetural (ADR)

### Contexto
O fluxo de confirmação e expiração de pagamentos manuais ("manual_pix") foi consolidado (fases D0 a D7) envolvendo controllers, schemas de validação, application services com regras de autorização/ownership estritas e proteção contra mass assignment. O projeto atingiu 312 testes em 18 suítes com 100% de passagem e auditorias limpas. 

### Problema
Sem uma fronteira arquitetural definida, o crescimento orgânico do módulo de pagamentos pode levar ao acoplamento entre regras de negócio, autorização e transições de estado, violando a separação de responsabilidades. Há também o risco de vazamento de regras de negócio para os controllers, confusão semântica em relação a pagamentos reais (como integrações de provedores Pix ou Stripe), e implementações ad-hoc de jobs automatizados que desrespeitem a autorização do sistema.

### Decisão
Estabelecer fronteiras rígidas para o módulo de `manual payments` (pagamentos não-automatizados). Foram estabelecidas as seguintes decisões e responsabilidades:

#### Classificação de Camadas
* **Controllers**: Permanecem finos. Responsáveis unicamente por orquestrar a chamada HTTP e repassar dados para o service. Não devem possuir regras de negócio pesadas nem duplicar a verificação de autorização.
* **Schemas**: Encarregados da validação de input e da proteção contra *mass assignment*.
* **Presenters**: Efetuam a tradução segura e isolada de status para o cliente (ex: PT-BR).
* **Application Services**: Centralizam a autorização, regras de ownership e a orquestração do fluxo da aplicação.
* **Repositories**: Camada exclusiva para o acesso a dados e persistência.
* **Models**: Responsáveis pela persistência e definição estrutural/enums.
* **Domain Rules**: Gerenciam invariantes de domínio e controlam as transições de estado válidas.

#### Decisão sobre Application Services
* As funções `confirmManualBookingPayment` e `expireOverdueManualBookingPayment` são classificadas estritamente como **Application Services**.
* A autorização e a verificação de *ownership* deverão permanecer **centralizadas** nestes services. Qualquer caller (controller, cron, job, etc) futuro deverá respeitar e consumir os services.
* O fluxo administrativo e o fluxo operacional do cliente utilizam os mesmos princípios de proteção e isolamento por este canal.

#### Regra para Cron/Job Futuro
* Atualmente não existe cron, job, scheduler ou automação implementada para expiração ou confirmação.
* Se houver automação futura (ex: expiração de reserva pendente), **deve ser precedida por uma fase/ADR própria**.
* Um job futuro **não deve reaproveitar cegamente a rota administrativa**. Deve-se criar um *use case* separado ou promover uma refatoração clara para separar as responsabilidades do `actor humano` do `actor sistema` (scheduler).

#### Regra para Limites Financeiros
* O **Doodads não intermedia dinheiro** referente ao serviço prestado pela barbearia. O cliente paga o valor diretamente à barbearia/prestador.
* O Doodads opera apenas como registro de estado operacional da reserva e do pagamento.
* Não há operações financeiras ativas: sem split de pagamento, sem uso de Stripe Connect, sem carteira digital, sem custódia e sem um provider de pagamento real neste fluxo.
* Está **estritamente proibida** a implementação de Pix real, geração de QR Code, webhook financeiro ou armazenamento de chave Pix bruta antes de uma fase arquitetural específica no futuro para este fim.

#### Critérios de Refatoração Futura
* O arquivo `bookingPaymentManual.service.ts` deverá ser refatorado se crescer além do limite sustentável (limite sugerido: service assumindo múltiplas responsabilidades descorrelacionadas ou ultrapassando 500-600 linhas).
* Possível separação futura recomendada:
  * `manualPaymentCreate.service.ts`
  * `manualPaymentConfirm.service.ts`
  * `manualPaymentExpire.service.ts`
  * `manualPaymentAuthorization.service.ts`
  * `manualPaymentStatusTransition.service.ts`

### Riscos Identificados (Ônus)
* Duplicidade conceitual e de estado entre `BookingPayment.status`, `Reserva.paymentStatus` e `Reserva.status`.
* Acoplamento inerente entre regras de autorização e as transições de estado.
* Risco de "admin bypass" amplo (permissão super-admin excedendo o necessário na operação).
* Confusão semântica de "manual_pix" com uma integração Pix de fato.
* Crescimento do módulo de pagamento em complexidade além do necessário para a viabilidade do MVP.

### Mitigadores e Consequências Positivas
* Forte cobertura de testes baseada em TDD (Test-Driven Development).
* Uso de presenters (PT-BR) isolando a visão da camada de modelo.
* Schemas restritos (Zod/Joi) garantindo a segurança de entrada (*strict*).
* Application services centralizando regras de ownership, prevenindo falhas de autorização.
* Realização contínua de auditorias e proteções automáticas.
* Proibição explícita e documentada de Pix real.
* Processo de `review/merge` controlado, com *gates* (TypeScript e Testes) e relatórios explícitos de segurança.

## Próximos Passos
**Permitidos:**
* Seguir com outras features estritas do MVP respeitando as fronteiras definidas (ex: frontend/UI).
* Ajustes documentais ou de infraestrutura que não quebrem esta ADR.

**Proibidos:**
* Implementar Pix real, QR Code, webhooks, provider de pagamento ou cobranças reais.
* Criar *cron jobs* ou *schedulers* sem especificação prévia e ADR dedicada.
* Adicionar regras de negócio em controllers.

## Comandos Executados e Resultados Reais

**Testes**
```bash
cd server && npm run test
```
**Resultado Real:** `Test Suites: 18 passed, 18 total. Tests: 312 passed, 312 total. Time: 106.48 s. Ran all test suites.`

**TypeScript**
```bash
cd server && npx tsc --noEmit
```
**Resultado Real:** O comando executou com sucesso (0 erros de compilação).

**Auditoria de Artifacts**
```bash
git ls-files | grep -E '(^|/)node_modules/|(^|/).next/|(^|/)dist/|(^|/)build/|(^|/)coverage/|.map$' || true
```
**Resultado Real:** Nenhum artefato proibido encontrado (limpo).

**Auditoria de .env e Secrets**
```bash
git ls-files | grep -E '(^|/).env$|.env.' || true
grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=build --exclude-dir=coverage --exclude-dir=.git 'PIX.*SECRET=.*|PIX.*KEY=.*|STRIPE_SECRET_KEY=.*|STRIPE_WEBHOOK_SECRET=.*|JWT_SECRET=.*|mongodb+srv://|DATABASE_URL=.*|defaultsecret|eyJ' . || true
```
**Resultado Real:** Encontrado apenas arquivo de template/configuração esperado (`server/config/env.ts`). O grep de credenciais expostas reportou um arquivo documental antigo sem chave exposta, confirmando que a base de código está limpa de senhas reais ou `.env` não commitado acidentalmente.

**Auditoria de Escopo**
```bash
git diff --name-only main...HEAD | grep -E '^client/|^server/' || true
```
**Resultado Real:** Escopo limpo, sem nenhuma alteração funcional nos códigos (`client/` e `server/`). Apenas adição de documentação neste diretório de relatórios.

## Decisão GO / NO-GO
DECISÃO: PHASE D8 DOCUMENTAL IMPLEMENTADA COM ADR DE FRONTEIRA ARQUITETURAL DO MÓDULO MANUAL PAYMENTS, CONSOLIDANDO D0-D7, CLASSIFICANDO CONFIRMAÇÃO E EXPIRAÇÃO COMO APPLICATION SERVICES, CENTRALIZANDO AUTORIZAÇÃO/OWNERSHIP NO SERVICE, PRESERVANDO CONTROLLERS FINOS, DEFININDO LIMITES FINANCEIROS, PROIBINDO PIX REAL/PROVIDER/WEBHOOK SEM FASE FUTURA ESPECÍFICA, DEFININDO REGRA PARA CRON/JOB FUTURO E REGISTRANDO RISCOS/MITIGADORES. NENHUMA ALTERAÇÃO FUNCIONAL FOI REALIZADA. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.
