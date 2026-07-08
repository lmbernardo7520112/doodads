# Matriz de Rastreabilidade Documental — Módulo de Pagamento

Esta matriz correlaciona cada funcionalidade descrita nos rascunhos de documentação com a sua evidência de existência no código da branch `main` atual do Doodads, classificando-as e definindo as devidas ações documentais.

| Afirmação | Documento de Origem | Evidência no Código / Relatório | Classificação | Decisão Documental | Ação Recomendada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Doodads não custodia nem recebe valores bancários** | `auditoria_implementacao_pagamento.md` | `reports/075...` (Seção Limites Financeiros) | **IMPLEMENTADO** | Manter e enfatizar em todos os arquivos como princípio inegociável. | Garantir destaque visual. |
| **Barbeiro pode confirmar recebimento Pix no dashboard** | `auditoria_implementacao_pagamento.md` | `server/services/bookingPaymentManual.service.ts#confirmManualBookingPayment` | **IMPLEMENTADO** | Confirmar como fluxo administrativo manual baseado em verificação humana. | Manter, detalhando que a verificação é 100% externa ao app. |
| **Barbeiro pode expirar pagamento vencido no dashboard** | `auditoria_implementacao_pagamento.md` | `server/services/bookingPaymentManual.service.ts#expireOverdueManualBookingPayment` | **IMPLEMENTADO** | Confirmar como ação administrativa manual. | Manter. |
| **O agendamento fica bloqueado na agenda como pendente** | `auditoria_implementacao_pagamento.md` | `server/models/Reserva.ts` (campo `status` como `"pendente"`) | **IMPLEMENTADO** | Confirmar e descrever o comportamento do status `pendente` e `paymentStatus`. | Manter. |
| **Instrução Pix estática exibida no card do cliente** | `auditoria_implementacao_pagamento.md` | `client/components/ui/AppointmentCard.tsx` | **IMPLEMENTADO** | Confirmar que exibe informações estáticas (chave da barbearia configurada) para transferência por fora. | Descrever como exibição de instrução direta, não Pix dinâmico. |
| **Botão "Já enviei o Pix" no card do cliente** | `auditoria_implementacao_pagamento.md` | `client/components/ui/AppointmentCard.tsx#handleReportPaymentConfirm`, `server/services/bookingPaymentManual.service.ts#reportManualBookingPayment` | **IMPLEMENTADO** (E3.3) | Funcionalidade integrada: cliente declara envio, status transiciona para `manual_review`. | Manter. |
| **Status `manual_review` ("Em análise manual")** | `auditoria_implementacao_pagamento.md` | `server/services/bookingPaymentManual.service.ts#reportManualBookingPayment`, rota `PATCH /declarar-pago` | **IMPLEMENTADO** (E3.3) | Transição ativa: `pending` → `manual_review` pelo cliente, `manual_review` → `paid` pelo barbeiro. | Manter. |
| **Endpoint legado `PATCH /:id/pagar` (`pagarReservaSimulado`)** | Código legado pré-E3.3 | Removido em Phase E3.3 | **REMOVIDO** | Endpoint que simulava pagamento com `paymentStatus: "aprovado"` foi eliminado por inconsistência com o fluxo manual governado. | Nenhuma ação — código morto eliminado. |
| **Geração de QR Code e Pix copia-e-cola dinâmico** | `plano_implementacao_pix_real.md` | Nenhuma | **FUTURO/PIX REAL** | Isolar estritamente em plano de desenvolvimento futuro. | Esclarecer que não há qualquer integração bancária ou de provider e rotular como "Proposta Futura". |
| **Notificação de Webhook para confirmação bancária** | `plano_implementacao_pix_real.md` | Nenhuma | **FUTURO/PIX REAL** | Isolar estritamente em plano de desenvolvimento futuro. | Catalogar como fluxo planejado futuro dependente de infraestrutura e provedores reais. |
| **Uso de WebSockets para atualização do cliente** | `plano_implementacao_pix_real.md` | Nenhuma | **FUTURO/PIX REAL** | Tratar como arquitetura recomendada para a fase futura de Pix Real. | Manter apenas no plano futuro. |
| **Execução automática de cancelamento por Cron/Job** | `auditoria_implementacao_pagamento.md` | Nenhuma | **FORA DE ESCOPO / REMOVER** | Remover qualquer menção de cron executando de fato na versão atual. | Deixar claro que a expiração é disparada por ação administrativa ou manual. |

---

## Legenda de Classificações

1. **IMPLEMENTADO**: Código presente e testado na branch `main` atual.
2. **PARCIALMENTE IMPLEMENTADO**: A infraestrutura de dados ou enums existe na `main`, mas o fluxo funcional não está concluído/ativo na interface estável.
3. **PLANEJADO**: Funcionalidade em desenvolvimento ou que aguarda fusão a partir de branches de correção.
4. **FUTURO/PIX REAL**: Fluxos reais de intermediação financeira e automações integradas que dependem de nova especificação técnica e de negócios.
5. **FORA DE ESCOPO**: Funcionalidades não autorizadas para o estágio atual do produto.
6. **REMOVER/REESCREVER**: Textos ambíguos ou declarações factualmente incorretas no rascunho.
