# Checklist Operacional — Pagamento Manual — Doodads

Este checklist orienta administradores e equipes de suporte do Doodads na ativação e operação do fluxo de pagamentos manuais diretos às barbearias.

---

## 1. Configurações Prévias da Barbearia

- [ ] **Definir Chave Pix de Recebimento**: Configurar no painel da barbearia a chave Pix de destino para que o cliente saiba exatamente para onde transferir os valores.
- [ ] **Configurar BookingPolicy**:
  - [ ] Validar que `requirePrepayment` está definido corretamente (conforme o plano de negócios da barbearia).
  - [ ] Definir `paymentExpirationMinutes` (prazo máximo recomendado: 15 a 30 minutos).
- [ ] **Cadastrar Instruções Estáticas de Pagamento**: Garantir que o texto exibido ao cliente detalhe a chave Pix e o nome do favorecido, evitando erros na transferência.

---

## 2. Onboarding do Cliente (Fluxo de Uso)

- [ ] **Orientação de Aceite de Termos**: Certificar-se de que o fluxo do cliente exige a caixa de seleção de termos de pré-pagamento (`acceptedTerms`) antes de concluir o agendamento.
- [ ] **Orientação de Envio**: Esclarecer ao cliente que clicar em "Já enviei o Pix" é uma **declaração de envio manual**. Ela não valida a transferência automaticamente, apenas notifica o estabelecimento.
- [ ] **Aviso de Não Custódia**: A tela de confirmação deve deixar claro que o Doodads não recebe nem custodia o dinheiro, eximindo o app de disputas financeiras diretas.

---

## 3. Onboarding do Barbeiro (Fluxo de Operação)

- [ ] **Conferência Externa Obrigatória**: Instruir o barbeiro/gerente a **nunca** clicar em "Confirmar recebimento" sem antes abrir o aplicativo do seu banco e verificar o extrato real.
- [ ] **Gerenciamento de Abas**: Orientar o barbeiro a utilizar as abas "Pendentes" e "Todos" para acompanhar reservas em análise (`manual_review`).
- [ ] **Tratamento de Expirações**: Ensinar o barbeiro a utilizar o botão "Marcar como expirado" caso o cliente declare o envio falsamente (sem transferência real) ou caso o tempo de tolerância expire.
- [ ] **Suporte a Cancelamentos**: Explicar que agendamentos confirmados (`paid`) não podem ser cancelados pelo cliente via app, exigindo intervenção manual da barbearia.

---

## 4. Auditoria de Segurança e Compliance Técnico

- [ ] **Confirmar Ausência de Código Integrado**: Garantir que não há credenciais de provedores reais de Pix, tokens ou webhooks ativos na base de dados de produção.
- [ ] **Validar Retorno 404 do Endpoint Legado**: Testar periodicamente que chamadas para `PATCH /api/reservas/:id/pagar` retornam HTTP 405/404 e não aprovam reservas silenciosamente.
- [ ] **Inspeção de Logs de Transação**: Validar que os logs da aplicação não contêm dados confidenciais (secrets de APIs financeiras, dados de cartões ou payloads sensíveis).
