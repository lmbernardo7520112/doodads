# 097 — Manual Payment Baseline Release Readiness (RR1) — Doodads

**Data**: 2026-07-08  
**Fase**: `DOODADS-MANUAL-PAYMENT-BASELINE-RELEASE-READINESS-PHASE-RR1`  
**Commit validado**: `7dae350` (main)  

---

## 1. Objetivo

Consolidar a baseline oficial de release readiness do fluxo manual de reservas e pagamentos governados no Doodads, sem alterar código funcional. Esta fase estabelece a documentação operacional e técnica de suporte a lançamentos, a matriz de fluxos validados de ponta a ponta e o checklist de uso, desenhando uma fronteira explícita antes de evoluções para integrações financeiras reais.

---

## 2. Documentos e Relatórios Analisados

Foram revisados integralmente os seguintes artefatos para a elaboração da baseline:

### Relatórios Históricos
- `reports/090`: Governança terminológica e alinhamento DOC-P0.
- `reports/091`: Limpeza de seed e remoção do fluxo de simulação legado (E3.3).
- `reports/092`: Hardening de reservas passadas (E3.2 + E3.3).
- `reports/093`: Validação regressiva completa V2 (com identificação da limitação de prepayment).
- `reports/094`: Registro pós-merge da V2.
- `reports/095`: Validação fresh ponta a ponta com prepayment ativo (`requirePrepayment = true`) e inclusão da nota terminológica.
- `reports/096`: Registro pós-merge da V2.1.

### Documentos DOC-P0
- `docs/payments/manual-payment-current-state.md`
- `docs/payments/payment-documentation-traceability-matrix.md`
- `docs/payments/payment-terminology-governance.md`
- `docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md`

---

## 3. Documentação Criada nesta Fase

| Documento | Caminho | Descrição |
|---|---|---|
| **Baseline de Release** | `docs/payments/manual-payment-release-baseline.md` | Consolida os fluxos suportados, não suportados, estados, transições, bloqueios e fronteiras contra Pix real. |
| **Matriz de Fluxos** | `docs/payments/manual-payment-validated-flow-matrix.md` | Mapeamento detalhado de todos os 9 cenários lógicos e operacionais validados em laboratório. |
| **Checklist Operacional** | `docs/payments/manual-payment-operational-checklist.md` | Lista de verificações e orientações práticas para a equipe e usuários (cliente/barbeiro) operarem o app. |

---

## 4. Estado Validado do Fluxo Manual

O fluxo manual governado está 100% testado e validado de ponta a ponta na branch principal (`main`):
- A criação de reserva com `requirePrepayment = true` e o aceite de termos `acceptedTerms` geram corretamente a reserva pendente (`pending`) vinculada a um `BookingPayment` pendente com prazo de 15 minutos.
- A transição do cliente ("Já enviei o Pix") move o fluxo com segurança para `"manual_review"`.
- A confirmação manual do barbeiro transiciona o pagamento para `"paid"` e confirma a reserva.
- A expiração manual do barbeiro transiciona o pagamento para `"expired"` e cancela o agendamento.
- Cancelamentos e validações temporais (bloqueios de reserva passada com `ALREADY_OCCURRED` e de reserva paga com `ALREADY_PAID_CANCEL`) operam estritamente como especificado.
- A rota legada `PATCH /api/reservas/:id/pagar` foi removida (retorna 404).

---

## 5. Limitações e Riscos Residenciais Registrados

1. **Confirmação Cega pelo Barbeiro**: Há risco de o barbeiro confirmar um pagamento sem verificar seu saldo bancário externo real. O checklist operacional e as advertências da UI buscam mitigar esse risco de fraude do cliente.
2. **Expiração Manual**: A expiração depende da ação de "Marcar como expirado" do barbeiro ou de expiração sob demanda na listagem, não existindo scheduler rodando automaticamente em background.
3. **Ausência de Gateway**: Nenhuma integração Pix real está habilitada, garantindo conformidade com o princípio de não custódia financeira pelo Doodads.

---

## 6. Recomendação e Decisão (GO/NO-GO)

### GO/NO-GO: **GO** 🟢
O fluxo de reservas e pagamento manual governado está pronto para liberação operativa (release readiness) sob o modelo de baseline documentado.

### Confirmação de Escopo
Confirmado que nenhuma alteração funcional (código backend, frontend, bancos, migrações, pacotes ou scripts) foi realizada nesta fase, limitando o diff a arquivos de documentação Markdown (`.md`).
