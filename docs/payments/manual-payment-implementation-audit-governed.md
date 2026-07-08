# Auditoria de Implementação: Fluxo de Pagamento Manual com Instrução de Pagamento Direto à Barbearia

Este documento fornece um relatório de auditoria sistemático, profundo e cronológico sobre a engenharia e as regras de implementação do módulo de pagamento manual no projeto **Doodads**.

---

## 1. Princípios Financeiros e Arquiteturais
* **Não Intermediação Financeira**: O Doodads **não** processa, não armazena, não intermedia e não custodia valores financeiros. Todo pagamento referente aos serviços prestados pelas barbearias parceiras é transferido diretamente do cliente para a conta bancária do estabelecimento.
* **Isolamento do Registro de Estado**: O sistema funciona puramente como um organizador de estado lógico da reserva de horário, espelhando status de pagamento de forma informacional.
* **Sem Integrações Criptográficas ou Bancárias**: O fluxo de pagamento atual é estritamente baseado em transferências manuais por fora do aplicativo e confirmações manuais por parte dos funcionários. Não há comunicação com APIs do Banco Central (BACEN) ou adquirentes comerciais.

---

## 2. Estado da Implementação (Código Atual na branch `main`)

### A. Funcionalidades Implementadas
1. **Modelagem de Dados**:
   * **`BookingPolicy`**: Suporta configuração de obrigatoriedade de pré-pagamento (`requirePrepayment: true`) e limite de expiração (`paymentExpirationMinutes`).
   * **`BarbeariaPaymentConfig`**: Guarda informações administrativas de recebimento Pix da barbearia (chave e favorecido de exibição).
   * **`BookingPayment`**: Rastreia a transação de pagamento no backend.
2. **Ações do Barbeiro / Funcionário**:
   * O funcionário acessa o **Painel Operacional** (`BarberDashboard.tsx`) e visualiza reservas pendentes.
   * **`confirmManualBookingPayment`**: Serviço que permite ao barbeiro confirmar o recebimento do dinheiro (muda pagamento para `"paid"` e reserva para `"confirmado"`). A validação depende 100% da verificação do barbeiro em seu banco externo.
   * **`expireOverdueManualBookingPayment`**: Serviço que permite expirar o pagamento vencido (muda pagamento para `"expired"` e reserva para `"cancelado"`).
3. **Instruções ao Cliente**:
   * O cliente visualiza a chave Pix da barbearia no card do agendamento (`AppointmentCard.tsx`) para realizar a transferência manual pelo seu aplicativo bancário.

### B. Funcionalidades Planejadas (Não Integradas na branch `main` estável)
1. **Declaração do Cliente ("Já enviei o Pix")**:
   * A rota `PATCH /api/reservas/pagamento-manual/:bookingPaymentId/declarar-pago` e o respectivo botão de envio no frontend do cliente estão classificados como planejados para futuras correções.
   * Quando ativos, transicionarão o pagamento para o status `"manual_review"` ("Em análise manual").
2. **Expiração Automática por Cron/Job**:
   * Atualmente, **não** existem schedulers, cron ou timers automatizados rodando em segundo plano. Qualquer expiração depende de ações do barbeiro no painel ou de gatilhos acionados nas chamadas de consultas operacionais.

---

## 3. Matriz de Estados e Regras de Negócio

### Transições de Estado Autorizadas:
```
[Pendente / pending]  ──(Barbeiro confirma recebimento externo)──> [Confirmado / paid]
[Pendente / pending]  ──(Barbeiro expira por falta de saldo)─────> [Cancelado / expired]
```

### Segurança e Ownership:
* A autorização e a validação de propriedade da barbearia ou do usuário solicitante são centralizadas nos **Application Services** (`bookingPaymentManual.service.ts`), impedindo que chamadas forjadas alterem o estado de agendamentos de terceiros.
