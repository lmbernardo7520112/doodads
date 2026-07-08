# Governança de Terminologia de Pagamento

Este documento define o padrão semântico e as regras terminológicas para toda a documentação, comentários de código e mensagens de interface do usuário do projeto **Doodads**. O objetivo é evitar confusão conceitual e mitigar riscos jurídicos ou regulatórios decorrentes de uso inadequado de nomenclaturas financeiras.

---

## 1. Regras de Nomenclatura Obrigatórias

### A. "Pix Manual" vs. "Instrução de Pagamento Direto"
* **Proibido**: O uso isolado do termo "Pix Manual" ou "Integração Pix" para descrever o fluxo atual.
* **Obrigatório**: Se for necessário citar "Pix manual", a frase deve vir acompanhada da explicação explícita: **"(sem integração bancária direta)"**.
* **Termo Recomendado**: **"Pagamento manual com instrução de pagamento direto à barbearia"**.
* **Justificativa**: Evita que desenvolvedores ou parceiros comerciais acreditem que o Doodads realiza integração técnica ou liquidação de transações Pix.

### B. "Pix Real"
* **Termo Reservado**: O termo **"Pix Real"** deve ser reservado exclusivamente para o escopo de implementações futuras envolvendo:
  * Provedores/gateways licenciados (PSP);
  * QR Codes dinâmicos gerados via API;
  * Chaves Copia-e-Cola transacionais geradas dinamicamente;
  * Webhooks com confirmação criptográfica e liquidação automática.

### C. "Confirmar Pagamento"
* **Semântica no Fluxo Atual**: No fluxo manual atual do Doodads, "Confirmar Pagamento" representa unicamente a **auditoria visual humana** executada pelo barbeiro por meio do seu aplicativo de banco externo.
* **Proibido**: Descrever qualquer trecho do código do fluxo manual estável como "confirmação automática" ou "confirmação pelo sistema".

### D. "Já paguei" / "Já enviei o Pix"
* **Semântica Operacional**: No fluxo planejado do cliente, a ação de declarar o envio do Pix **não pode** sob nenhuma hipótese transicionar o pagamento para o status `paid` (Pago).
* **Comportamento Correto**: Esta ação apenas transiciona o status do pagamento para `manual_review` ("Em análise manual"), sinalizando ao barbeiro no dashboard que a transação requer auditoria visual no extrato bancário.

---

## 2. Dicionário de Termos Proibidos e Permitidos

| Termo Proibido/Restrito | Alternativa Obrigatória | Motivo da Restrição |
| :--- | :--- | :--- |
| Gateway Pix / Pix API | Instrução manual de transferência | O Doodads não possui comunicação com APIs bancárias na branch `main`. |
| Comprovante homologado | Declaração de envio do cliente | A declaração do cliente é declaratória e sem validação automatizada de autenticidade do Pix. |
| Liquidação / Compensação | Confirmação manual pelo barbeiro | A liquidação ocorre de forma privada nos bancos e a alteração no app é puramente administrativa. |
| Custódia / Split de Pagamento | Pagamento Direto ao Prestador | O Doodads opera sob tarifa/assinatura SaaS e não retém ou reparte o valor dos serviços. |
