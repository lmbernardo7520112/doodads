# 089 — Payment Documentation Governance Alignment — Phase DOC-P0 — Doodads

## 1. Objetivo da Fase
Garantir o alinhamento da documentação técnica e de negócios com o estado real de funcionamento do módulo de pagamentos do Doodads, extinguindo ambiguidades terminológicas e separando de forma estrita o fluxo de pagamento manual atual de propostas e planejamentos futuros (Pix Real com provedor/webhook).

---

## 2. Documentos Analisados
Foram revisados de forma exaustiva os seguintes relatórios e rascunhos:
* `auditoria_implementacao_pagamento.md` (Rascunho de auditoria do fluxo Pix manual)
* `plano_implementacao_pix_real.md` (Rascunho do plano para Pix real dinâmico)
* `reports/075-manual-payments-architecture-boundary-adr-phase-d8-doodads.md`
* `reports/079-spec-manual-payments-operational-query-contract-phase-d9-recovery-doodads.md`
* `reports/084-manual-payment-frontend-operational-mvp-phase-e2-doodads.md`
* `reports/085-review-merge-manual-payment-frontend-operational-mvp-phase-e2-doodads.md`

---

## 3. Problemas Encontrados na Documentação Anterior
1. **Contaminação Conceitual**: Termos como "Pix manual" misturavam a ideia de instrução visual estática com processamento de rede Pix real, induzindo a erros sobre o funcionamento do app.
2. **Afirmações Prematuras**: O rascunho de auditoria tratava o botão cliente "Já enviei o Pix" e o status `manual_review` como implementados, contudo essas lógicas residem em branches experimentais ou correções em andamento, não na branch estável (`main`).
3. **Falta de Destaque aos Limites Financeiros**: Os limites de que o Doodads não recebe nem custodia dinheiro do serviço e de que a expiração de pagamentos é manual (não automatizada via Cron/Job) precisavam ser formalizados de maneira canônica.

---

## 4. Decisões de Terminologia
* Rejeitar o uso isolado de "Pix manual" sem a advertência "(sem integração bancária direta)".
* Adotar prioritariamente a expressão **"Pagamento manual com instrução de pagamento direto à barbearia"** para o fluxo atual.
* Reservar "Pix Real" e terminologias de Webhook/QR Code apenas para desenvolvimentos futuros formais.
* Definir que a "Confirmação" no fluxo atual é estritamente humana/administrativa.

---

## 5. Resumo da Matriz de Rastreabilidade

* **Itens Reclassificados como Implementados**:
  * Exibição de instruções de pagamento estáticas (chave e favorecido da barbearia).
  * Ações do barbeiro de confirmar recebimento e marcar como expirado via `BarberDashboard.tsx`.
  * Preservação de ownership e segurança nos Application Services.
  * Não-custódia de valores pelo Doodads.
* **Itens Reclassificados como Planejados**:
  * Botão de declaração de Pix enviado do cliente ("Já enviei o Pix").
  * Rota de atualização `/declarar-pago` e status de análise `manual_review`.
* **Itens Reclassificados como Pix Real Futuro (Não Implementados)**:
  * Integração com APIs externas (Mercado Pago, Asaas, EFI).
  * Geração dinâmica de QR Codes e Pix Copia-e-Cola transacionais.
  * Validação de Webhooks por HMAC-SHA256 e WebSockets de atualização.
* **Itens Removidos / Reescritos**:
  * Sugestões de expirações automáticas via Cron/Job em background (classificado como fora do escopo atual).

---

## 6. Documentos Criados e Revisados no Repositório

### Novos Documentos Canônicos:
1. **`docs/payments/payment-documentation-traceability-matrix.md`** ([Matrix](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/payments/payment-documentation-traceability-matrix.md)): Matriz completa ligando afirmações documentais ao código da branch `main`.
2. **`docs/payments/manual-payment-current-state.md`** ([Current State](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/payments/manual-payment-current-state.md)): Estado atual detalhado do fluxo manual de cobrança.
3. **`docs/payments/payment-terminology-governance.md`** ([Terminology Governance](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/payments/payment-terminology-governance.md)): Regras terminológicas e restrições.
4. **`docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md`** ([ADR Proposed](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md)): Regras arquiteturais e requisitos de segurança para o desenvolvimento do Pix Real Futuro.

### Documentos Revisados e Sanitizados:
5. **`docs/payments/manual-payment-implementation-audit-governed.md`** ([Governed Audit](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/payments/manual-payment-implementation-audit-governed.md)): Auditoria estruturada do fluxo manual.
6. **`docs/payments/real-pix-dynamic-payment-plan-governed.md`** ([Governed Plan](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/payments/real-pix-dynamic-payment-plan-governed.md)): Proposta futura de integração de gateway Pix real.

---

## 7. Confirmação de Auditoria de Código e Escopo

* **Nenhum arquivo funcional** (backend, frontend, rotas, services, controllers, modelos ou testes) foi editado, criado ou deletado.
* **Nenhuma migração** ou alteração em banco foi efetuada.
* **Nenhuma chave secreta ou credencial** real foi adicionada ou exposta.

---

## 8. Decisão GO / NO-GO
**DECISÃO**: PHASE DOC-P0 IMPLEMENTADA COM GOVERNANÇA DOCUMENTAL DE PAGAMENTOS. OS DOCUMENTOS DE AUDITORIA MANUAL E PIX REAL FORAM RECLASSIFICADOS E REESCRITOS EM DOCUMENTAÇÃO CANÔNICA, SEPARANDO ESTADO ATUAL, PLANEJADO E FUTURO. O FLUXO MANUAL FOI DESCRITO COMO PAGAMENTO MANUAL COM CONFIRMAÇÃO HUMANA, SEM PIX REAL. O PIX REAL FOI ISOLADO COMO TRILHA FUTURA EM ADR/P0, DEPENDENTE DE PROVIDER, SANDBOX, WEBHOOK, IDEMPOTÊNCIA, SEGURANÇA DE CREDENCIAIS E SEPARAÇÃO FINANCEIRA. NENHUM CÓDIGO FOI ALTERADO.
