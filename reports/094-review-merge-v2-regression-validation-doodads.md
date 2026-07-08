# 094 — Review Merge V2 Regression Validation — Doodads

**Data**: 2026-07-08  
**PR**: [#33](https://github.com/lmbernardo7520112/doodads/pull/33)  
**Branch**: `docs/doodads-full-manual-payment-regression-validation-v2`  
**Merge commit**: `a9e3b97`  

---

## 1. Estado Inicial do PR #33

| Campo | Valor |
|---|---|
| Título | docs(doodads): validate manual payment and reservation regression v2 |
| Estado | OPEN → MERGED |
| Mergeable | MERGEABLE (clean) |
| Arquivos alterados | 1 (`reports/093-full-manual-payment-and-reservation-regression-validation-v2-doodads.md`) |
| Adições | +157 |
| Remoções | -0 |
| Body | Atualizado com o conteúdo do relatório 093, incluindo a limitação na seção 13 |

---

## 2. Confirmação de Escopo Documental

O diff da branch para a `main` foi inspecionado antes do merge. Foi confirmado que o PR alterou única e exclusivamente o arquivo de relatório:
- `reports/093-full-manual-payment-and-reservation-regression-validation-v2-doodads.md`

Não houve nenhuma alteração em arquivos de código backend, frontend, testes, scripts ou schemas.

---

## 3. Arquivos Analisados

| Arquivo | Descrição |
|---|---|
| `reports/093-full-manual-payment-and-reservation-regression-validation-v2-doodads.md` | Relatório de validação regressiva v2 que descreve os cenários testados e os resultados dos gates. |

---

## 4. Validações Confirmadas no Relatório 093

1. **Presença de DOC-P0**: Os quatro documentos fundamentais estão mantidos e preservados (`manual-payment-current-state.md`, `payment-documentation-traceability-matrix.md`, `payment-terminology-governance.md` e `ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md`).
2. **Presença de Reports Recentes**: Reports 090, 091 e 092 preservados.
3. **Remoção do Legado**: Confirmada a remoção total de `pagarReservaSimulado` e rotas/politicas associadas no backend ativo. Chamadas para `PATCH /api/reservas/:id/pagar` retornam HTTP 404.
4. **Gates e Suítes**: 23 suítes / 355 testes passaram, compilação TypeScript com 0 erros, build do frontend gerado com sucesso.
5. **Fluxo do Cliente**: Criação de reserva nasce como `pendente`/`pendente`. Cancelamento de reserva futura funciona adequadamente.
6. **Bloqueio de Reserva Paga**: Cancelamento de reserva com pagamento `paid` ou `aprovado` (legado) bloqueado com erro `ALREADY_PAID_CANCEL`.
7. **Abas do Frontend**: Ativas, Passadas, Canceladas e Todas visíveis e filtrando corretamente. Reservas antigas exibem o badge "Horário já passou".
8. **Ausência de Pix Real**: Confirmado que Doodads não recebe, processa ou custodia dinheiro real, e não há QR codes Pix dinâmicos ou webhooks ativos na main.

---

## 5. Limitação Registrada sobre `paymentRequired=false`

O relatório 093 detalha formalmente a limitação de prepayment da validação:
- Durante a validação regressiva via API da Phase V2, a reserva criada nasceu com `paymentRequired: false` devido às configurações padrão da barbearia de teste.
- Portanto, essa evidência não comprova de forma isolada a criação fresh de um `BookingPayment` manual pendente sob política de pré-pagamento obrigatório.
- Ficou acordado que uma validação futura específica do fluxo Pix manual com pré-pagamento ativo precisará parametrizar explicitamente a barbearia/policy para `requirePrepayment = true`, embora a suíte de testes unitários e de integração (35+ testes dedicados de BookingPayment) já cubra o comportamento com sucesso.

---

## 6. Auditoria de Secrets no Report

O arquivo de relatório 093 foi varrido contra chaves privadas, secrets de APIs, URLs de banco com credenciais e tokens JWT.
- **Resultado**: ✅ Nenhuma credencial ou secret foi exposta no relatório.

---

## 7. Decisão

**DECISÃO: PR #33 REVISADO, MERGEADO E VALIDADO COMO RELATÓRIO DOCUMENTAL DA PHASE V2. A MAIN FOI VALIDADA CONTRA REGRESSÕES PÓS-E3.2/E3.3, COM DOC-P0 PRESENTE, LEGADO REMOVIDO, ENDPOINT `PATCH /:id/pagar` RETORNANDO 404, TESTES/TYPESCRIPT/BUILD VERDES, RESERVAS PASSADAS ORGANIZADAS, CANCELAMENTO VALIDADO E PAINEL BARBEIRO OPERACIONAL. A LIMITAÇÃO SOBRE A RESERVA CRIADA COM `paymentRequired=false` FOI REGISTRADA, SEM INFLAR A CONCLUSÃO. NÃO HOUVE ALTERAÇÃO FUNCIONAL NEM PIX REAL.**
