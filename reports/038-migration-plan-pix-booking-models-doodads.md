# Plano de Migração Incremental e Threat Model

Este documento atende aos **Gates 9 e 10** da fase `DOODADS-PIX-BOOKING-DOMAIN-MODELS-SPEC`.

## 1. Plano de Migração Incremental (Gate 9)

**Fase A: Fundação (Data Only)**
- Criar os arquivos de model Mongoose (`BookingPayment.ts`, `BookingPolicy.ts`, etc.).
- Nenhum comportamento de produção é alterado.
- Adicionar os campos opcionais novos em `Reserva.ts`.
- Subir em PR isolado; verificar estabilidade na `main`.

**Fase B: Política Padrão (Policy Injection)**
- Implementar a injeção de `BookingPolicy` default para cada barbearia.
- A criação de barbearia passa a criar automaticamente sua policy default.
- Ainda sem interface de pagamento, apenas amarrando a regra de negócio com a reserva (snapshot).

**Fase C: Termos e Aceite (Legal Layer)**
- Inserir `TermsVersion` no banco e expor via API para o frontend.
- Implementar a captura de `TermsAcceptance` associado à reserva.
- A criação da reserva (`POST /api/reservas`) só é aceita se vier com o token do aceite.

**Fase D: Fallback Manual (MVP Financeiro)**
- Implementar fluxo `manual_pix` (`BarbeariaPaymentConfig`).
- A reserva é criada com `status = payment_pending`.
- O proprietário recebe notificação, confirma o Pix e muda o estado via painel para `paid/confirmed`.
- Aciona a engrenagem do ciclo de vida completo no frontend.

**Fase E: Pix Automático (Integração Total)**
- Habilitar `pix_provider`.
- Integração com o PSP (Gerador de QR Code).
- Webhook ativo, checando `idempotencyKey` e atualizando a reserva via Service/Policy.
- Mecanismo de conciliação.

## 2. Threat Model (Gate 10)

| Ameaça | Modelo Afetado | Risco | Mitigação |
| --- | --- | --- | --- |
| Manipulação de Status (Mass Assignment) | Reserva, BookingPayment | Cliente setar `status=confirmed` direto no request | Controle via schemas estritos (Zod), status só alterável pela service |
| Pagamento Duplicado | BookingPayment | Cobrar 2x ou atualizar banco 2x | Uso de `idempotencyKey` única por tentativa; transação travada |
| Webhook Falso | BookingPayment, Reserva | API ser enganada e aprovar pagamento fake | Validar assinatura HMAC no controller; não confia cegamente no body |
| Pagamento Tardio | BookingPayment, Reserva | Cliente pagar após expiração; conflito | Envio direto do evento a `manual_review` para conciliação humana |
| Reserva sem Aceite Legal | TermsAcceptance | Barbeiro perde causa em disputa de no-show | Controller bloqueia criação se `termsAcceptanceId` não vier no DTO |
| Termos Alterados | TermsVersion, TermsAcceptance | Cliente alegar que não viu aquela regra | Snapshot gravado em `TermsAcceptance` + versionamento em `TermsVersion` |
| Exposição Chave Pix | BarbeariaPaymentConfig | Vazamento ou substituição maliciosa | RBAC (só owner edita); mascara a chave na exibição pública |
| Exposição Credenciais | BarbeariaPaymentConfig | Vazamento grave e perda financeira | Refs de chaves (`credentialRef`), armazenadas apenas em Vault/Env/Secret Manager |
| Disputa de No-Show | Reserva, BookingPolicy | Cliente diz que chegou no horário | `noShowMarkedAt`, `noShowMarkedBy` com log do servidor e trava do snapshot |
| LGPD (IP/User-Agent) | TermsAcceptance | Armazenamento inseguro de PII | Armazenamento de HASH do IP e User-Agent, não string pura |
| Reserva Expirada travando | Reserva, BookingPayment | Agenda indisponível | Cronjob validando `paymentExpiresAt` para liberar horário via Service |
| Divergência Valor Pago | BookingPayment | Pagar menos no Pix Copia/Cola que o valor real | Validar `amountCents` retornado pelo Webhook = `amountCents` esperado |
