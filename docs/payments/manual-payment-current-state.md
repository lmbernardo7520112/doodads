# Estado Atual do Pagamento Manual no Doodads

Este documento estabelece a documentação canônica sobre o estado atual do fluxo de pagamento manual implementado na branch estável (`main`) do projeto **Doodads**.

---

## 1. Princípio Financeiro Inegociável
* **Doodads não recebe, processa, gerencia ou custodia valores financeiros.**
* O valor de qualquer serviço agendado é transferido diretamente do cliente para a conta bancária do prestador (barbearia) fora do ecossistema do Doodads.
* O Doodads atua unicamente como um **registro de estado operacional** para gerenciar a agenda e o status da reserva.

---

## 2. Definição do Fluxo Manual Atual (Implementado)
O fluxo manual implementado destina-se a segurar o horário do agendamento por tempo limitado (por padrão, 15 minutos) até que a barbearia confirme o recebimento por meio de auditoria externa.

### A. Papel do Cliente:
1. Ao realizar o agendamento de um serviço em uma barbearia com política de pré-pagamento ativa, a reserva é criada com status `"pendente"` e o pagamento com status `"pending"`.
2. O cliente visualiza no card do agendamento as instruções estáticas de pagamento:
   * Chave Pix (E-mail configurado na barbearia);
   * Favorecido (Razão social/nome da barbearia);
   * Valor nominal exato.
3. O cliente realiza a transferência Pix por meio do aplicativo de seu próprio banco.
4. **Nota de Estado:** Na branch estável atual (`main`), o cliente **não** possui interface ativa ou botão para marcar "Já enviei o Pix" ou enviar comprovantes. O status permanece como `"pending"` na tela até a ação administrativa.

### B. Papel do Barbeiro / Funcionário:
1. O funcionário acessa o **Painel Operacional** (`BarberDashboard`).
2. Ele visualiza a listagem de agendamentos pendentes da sua barbearia.
3. Ele realiza a verificação de saldo diretamente em sua conta bancária/extrato real (fora do aplicativo Doodads).
4. Se o valor foi recebido, o barbeiro clica em **"Confirmar recebimento"**. Isso dispara o fluxo no backend, atualizando o status do pagamento para `"paid"` e o da reserva para `"confirmado"`.
5. Se o tempo limite expirar sem o recebimento, o barbeiro clica em **"Marcar como expirado"**. Isso atualiza o pagamento para `"expired"` e cancela a reserva com o status `"cancelado"`.

---

## 3. Matriz de Estados

### Estados da Reserva (`Reserva.status`):
* `pendente`: Horário reservado temporariamente aguardando confirmação de pagamento.
* `confirmado`: Pagamento confirmado visualmente pelo barbeiro; agendamento garantido.
* `cancelado`: Cancelamento por falta de pagamento (expiração) ou por solicitação.
* `finalizado`: Atendimento concluído.

### Estados do Pagamento (`BookingPayment.status`):
* `pending`: Pagamento aguardando verificação.
* `paid`: Pagamento verificado e confirmado pelo barbeiro.
* `expired`: Pagamento não efetuado ou rejeitado administrativamente.
* `manual_review`: Estado reservado para análise (sem transição ativa na interface da `main`).
* `cancelled` / `refunded` / `failed`: Estados sistêmicos legados ou para fluxos especiais.

---

## 4. O que NÃO está Implementado (Limites do Fluxo)

1. **Ausência de Integração Bancária (Pix Real)**: O aplicativo não gera QR Codes dinâmicos, chaves copia-e-cola válidas de transação, nem possui comunicação de rede com o Banco Central ou gateways.
2. **Sem Webhooks**: Não há recebimento de notificações automáticas de pagamento de qualquer adquirente.
3. **Sem Expiração Automatizada**: Não há serviços de scheduler (Cron, RabbitMQ, BullMQ, etc.) rodando em segundo plano para cancelar reservas pendentes automaticamente. Toda a alteração para `"expired"` ou cancelamento por atraso depende da ação do barbeiro ou de disparos acionados por requisições de controllers existentes.
4. **Sem Upload de Comprovante**: A interface de usuário não aceita arquivos ou dados adicionais sobre a transação.
