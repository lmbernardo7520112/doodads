# 099 — Review Merge Manual Payment Baseline (RR1) — Doodads

**Data**: 2026-07-08  
**PR**: [#35](https://github.com/lmbernardo7520112/doodads/pull/35)  
**Branch**: `docs/doodads-manual-payment-baseline-release-readiness-rr1`  
**Merge commit**: `f2eb4b1`  

---

## 1. Estado Inicial do PR #35

| Campo | Valor |
|---|---|
| Título | `docs(payments): establish manual payment release readiness baseline` |
| Estado | OPEN → MERGED |
| Mergeable | MERGEABLE (clean) |
| Arquivos alterados | 4 (checklist operacional, baseline de release, matriz de fluxos e report 097) |
| Adições | +226 |
| Remoções | -0 |
| Body | Preenchido com o conteúdo do relatório 097 |

---

## 2. Confirmação de Escopo Documental

O diff da branch foi analisado e re-verificado contra a `main` antes e depois do merge:
- **Resultado**: ✅ Apenas arquivos Markdown de documentação e relatório (`.md`) nas pastas `docs/payments/` e `reports/` foram adicionados.
- Nenhuma modificação funcional em arquivos do servidor, cliente, dependências (`package.json`), bancos de dados ou scripts de implantação foi realizada.

---

## 3. Preservação do Report 098 e Histórico Recente

- **Resultado**: ✅ O relatório `reports/098-review-merge-booking-policy-phase-b-revalidation-pr36-doodads.md` permaneceu intacto e preservado na `main` durante e após o merge do PR #35.
- Todos os reports (090 a 098) e a pasta `docs/adr/` estão mantidos sem qualquer deleção.

---

## 4. Arquivos Analisados

| Arquivo | Descrição |
|---|---|
| `docs/payments/manual-payment-release-baseline.md` | Detalhamento dos limites, estados, transições, bloqueios temporais e fronteiras de segurança contra Pix real. |
| `docs/payments/manual-payment-validated-flow-matrix.md` | Matriz de testes de todos os 9 cenários do fluxo manual testados em laboratório. |
| `docs/payments/manual-payment-operational-checklist.md` | Instruções operacionais e recomendações para administradores, clientes e barbeiros. |
| `reports/097-manual-payment-baseline-release-readiness-rr1-doodads.md` | Relatório oficial da Phase RR1 que recomenda GO para o fluxo manual. |

---

## 5. Validação das Seções de Documentação

1. **Baseline**: Descreve apenas o fluxo manual governado (sem Pix real integrado, sem QR real, sem webhook). Deixa claro o princípio inegociável de **não custódia** pelo Doodads. Lista detalhadamente os estados (`Reserva` e `BookingPayment`) e os bloqueios regulados (`ALREADY_PAID_CANCEL`, `ALREADY_OCCURRED`).
2. **Matriz**: Mapeia perfeitamente a criação de reserva com `requirePrepayment = true`, a transição de status cliente para `manual_review` e as ações de confirmar/expirar/cancelar. Nenhuma menção a Pix real integrado como validado.
3. **Checklist**: Orienta a ativação sob a policy de pagamento manual correta. Destaca a necessidade da conferência humana bancária pelo barbeiro antes de confirmar. Não solicita credenciais reais nem sugere Stripe, webhooks ou QRs reais como parte do fluxo operacional ativo.
4. **Report 097**: Justifica adequadamente o parecer favorável ao release, restringindo a recomendação **GO** ao pagamento manual governado.

---

## 6. Auditoria de Secrets

Os novos arquivos de documentação foram varridos e estão totalmente limpos de credenciais e chaves confidenciais.
- **Resultado**: ✅ Clean.

---

## 7. Decisão

**DECISÃO: PR #35 REVISADO, MERGEADO E VALIDADO COMO BASELINE DE RELEASE DO PAGAMENTO MANUAL GOVERNADO. A MAIN PRESERVA O REPORT 098 E PASSA A CONTER DOCUMENTAÇÃO OPERACIONAL COM BASELINE, MATRIZ DE FLUXOS, CHECKLIST, LIMITAÇÕES E RISCOS RESIDUAIS. A RECOMENDAÇÃO GO FOI VALIDADA APENAS PARA O FLUXO MANUAL, SEM PIX REAL, PROVIDER, WEBHOOK, QR, STRIPE, SPLIT OU CUSTÓDIA. NENHUMA ALTERAÇÃO FUNCIONAL FOI INTRODUZIDA.**
