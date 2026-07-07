# Plano de Desenvolvimento Futuro: Integração Pix Dinâmico Real

* **Status**: Proposta de Trilha Futura (Não Implementado)
* **Requisito Prévio**: Aprovação formal da [ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0](file:///home/leonardomaximinobernardo/My_projects/doodads/docs/adr/ADR-PIX-REAL-DIRECT-TO-BARBERSHOP-P0.md)

---

## 1. Escopo & Separação de Conceitos
Este plano descreve as diretrizes técnicas necessárias para o desenvolvimento futuro de uma integração real com Pix Dinâmico (QR Code e Webhook). 
Este fluxo é **completamente separado** do sistema de pagamento manual atual e não reutiliza suas lógicas de transição administrativa direta.

---

## 2. Princípios de Segurança e Engenharia Financeira

### A. Não-Custódia de Valores
* O Doodads funcionará apenas como gateway de informação. O dinheiro pago pelo cliente liquidará diretamente na conta da barbearia parceira junto ao provedor de pagamento (PSP) escolhido, sem reter valores ou transacionar por contas do Doodads, evitando complexidades regulatórias.

### B. Proteção de Secrets e Credenciais
* As chaves de API, credenciais e a chave Pix real da barbearia (`pixKeyReal`) **nunca** devem ser salvas em texto claro no banco de dados. Devem ser criptografadas utilizando algoritmos simétricos robustos (ex: AES-256-GCM) antes de serem salvas em `BarbeariaPaymentConfig`.

### C. Autenticação e Validação de Webhooks
* O endpoint de recebimento de notificações do provedor (`POST /api/pagamento/webhook`) deve validar a assinatura do evento utilizando segredos HMAC-SHA256 fornecidos pelo provedor na configuração do webhook para rejeitar falsificações de chamadas REST.

### D. Garantia de Idempotência
* Toda mensagem de alteração de status enviada pelo webhook deve conter um ID exclusivo de evento e chave de idempotência. O processamento deve rejeitar eventos repetidos ou fora de ordem cronológica.

---

## 3. Arquitetura Proposta do Fluxo Real

```
[Cliente confirma reserva] 
          │
          ▼
[Backend Doodads] ────(API Request)────> [Provedor de Pagamento (MercadoPago/Asaas)]
                                                        │
                                                        ▼
[Visualiza QR Code / Copia-e-Cola] <──(QR Code Base64)──┘
          │
          ▼
[Cliente Paga no Banco]
          │
          ▼
[Provedor de Pagamento] ───(Webhook HMAC-SHA256)───> [Doodads PaymentWebhookService]
                                                              │
                                                              ▼
                                                   [Reserva = Confirmado]
```

---

## 4. Riscos Técnicos Identificados

1. **Vazamento de Credenciais de Clientes/Barbearias**: Risco mitigado pela obrigatoriedade de criptografia das chaves do adquirente em nível de banco de dados.
2. **Ataques de Replay e Requisições Forjadas (Spoofing)**: Resolvido pela validação restrita da assinatura HMAC nos cabeçalhos HTTP e filtragem de IPs permitidos do provedor.
3. **Erros de Sincronismo (Race Conditions)**: Situações onde o cliente atualiza a tela enquanto o webhook está processando a confirmação. Exige tratamento de travamento otimista no banco de dados e comunicação segura via Polling/WebSockets.
