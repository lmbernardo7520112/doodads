# ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0: Arquitetura para Implementação Futura de Pix Real Dinâmico

* **Status**: Proposed (Proposta)
* **Data**: 2026-07-07
* **Autor**: Antigravity AI Coding Assistant

---

## 1. Contexto
O ecossistema Doodads opera no modelo SaaS (Software as a Service) para barbearias. A atual funcionalidade estável de pagamento é manual e depende de ação humana direta de ambas as partes (cliente e barbeiro). Há interesse em planejar uma trilha futura de **Pix Real Dinâmico** (geração automática de QR Code e conciliação por Webhook).

---

## 2. Decisão Proposta (Regras Arquiteturais)

Se e quando a implementação do Pix Real for iniciada, as seguintes diretrizes arquiteturais e de segurança deverão ser obrigatoriamente aplicadas:

### A. Separação Financeira e Não-Custódia
* **Princípio Inegociável**: O Doodads **não deve custodiar ou transacionar em conta própria** os valores de serviços agendados pelas barbearias.
* A liquidação das cobranças deve ocorrer **diretamente na conta bancária do estabelecimento parceiro**, seja por conexão direta com a API do banco/provedor (PSP) do próprio parceiro ou por meio de uma arquitetura formal de subcontas/split aprovada por regulamentação de arranjos de pagamento (BACEN).

### B. Separação de Serviços no Código (Decoupling)
* Está proibida a reutilização direta das classes ou métodos do fluxo manual para processamento do Pix real.
* Devem ser criados três serviços independentes no backend para evitar acoplamento:
  1. **`ManualPaymentService`**: Mantém as regras exclusivas do fluxo manual legado/administrativo.
  2. **`ProviderPaymentService`**: Gerencia a comunicação com as APIs externas dos adquirentes (geração de cobrança Pix, consulta de status, expiração).
  3. **`PaymentWebhookService`**: Responsável exclusivo por processar, autenticar e validar as requisições de callback recebidas do provedor.
* O webhook **não deve chamar** a função `confirmManualBookingPayment` para fechar a transação, devendo existir um método específico do `ProviderPaymentService` com validações técnicas extras.

### C. Segurança de Dados Sensíveis e Secrets
* **Minimização de Gateway Response**: O retorno bruto da API do gateway (`gatewayResponse`) não deve ser armazenado na íntegra no banco de dados para evitar vazamento de dados de auditoria interna ou dados de identificação pessoal (PII). Apenas os campos estritamente necessários para conciliação financeira devem ser persistidos.
* **Proteção de Chaves Pix**: A chave Pix real de recebimento (`pixKeyReal`) **nunca** deve ser salva ou exposta em texto claro. Caso necessite armazenamento para fins de configuração do payload da API, ela deve ser criptografada na base de dados com algoritmos robustos (AES-GCM-256) e com chaves secretas geridas por KES (Key Management Service) ou variáveis de ambiente seguras.

### D. Idempotência e Segurança do Webhook
* O processamento do webhook exige **validação de assinatura** criptográfica obrigatória baseada no segredo configurado no provedor (HMAC-SHA256 ou assinatura de certificados digitais do banco).
* Devem ser implementadas defesas estritas contra ataques de repetição (*Replay Attacks*) e processamento duplicado de eventos utilizando chaves de idempotência indexadas no banco de dados.

---

## 3. Consequências e Restrições

* **Sem Implementação Imediata**: Este documento serve estritamente como guia diretivo de conformidade futura. Qualquer código, script de migração, variável de ambiente ou dependência de pacotes visando Pix Real permanece proibido nesta fase documental.
