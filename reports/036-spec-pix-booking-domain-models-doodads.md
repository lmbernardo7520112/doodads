# Especificação do Domínio: Modelos Persistentes para Pix Booking Payment (Doodads)

Este documento atende ao **Gate 2 e 8** da fase `DOODADS-PIX-BOOKING-DOMAIN-MODELS-SPEC`, mapeando o estado atual e especificando os ajustes futuros da entidade Reserva.

## 1. Auditoria dos Modelos Atuais

Foram inspecionados os modelos atuais: `Reserva`, `Barbearia`, `Servico` e `User`.

| Modelo atual | Campo existente | Lacuna | Risco | Modelo futuro relacionado |
| --- | --- | --- | --- | --- |
| **Reserva** | `status` (pendente, confirmado, cancelado, finalizado) | Faltam estados: `payment_pending`, `no_show`, `expired`, `manual_review` | Conflito de agenda, confirmação indevida sem pagamento | Ajuste na `Reserva` |
| **Reserva** | `paymentStatus` (pendente, aprovado, falhou) | Faltam estados: `not_required`, `paid`, `expired`, `refunded`, `manual_review` | Inconsistência financeira na conciliação Pix | Ajuste na `Reserva` |
| **Reserva** | `paymentId` (string) | Falta vínculo forte com entidade separada de pagamento | Difícil tratar idempotência e retentativas | `BookingPayment` e `BookingPaymentId` |
| **Reserva** | N/A | Falta registro de expiração do pagamento (`paymentExpiresAt`) | Cobrança Pix expirada mas reserva travando horário | Ajuste na `Reserva` e `BookingPayment` |
| **Reserva** | N/A | Falta snapshot de tolerância de chegada | Cliente chega atrasado e contesta regras que mudaram | Ajuste na `Reserva` e `TermsAcceptance` |
| **Reserva** | N/A | Falta identificação do aceite dos termos | Reserva gerada sem amparo legal/concordância | `TermsAcceptance` |
| **Barbearia** | N/A | Falta configuração do provedor Pix da barbearia e chave Pix | Plataforma processando recebíveis no lugar da barbearia | `BarbeariaPaymentConfig` |
| **Barbearia** | N/A | Faltam regras (no-show, janela de cancelamento, tolerância) | Conflitos com clientes, barbearia desprotegida | `BookingPolicy` |

## 2. Ajustes Futuros em Reserva (Gate 8)

Para comportar o novo fluxo sem quebrar o modelo atual imediatamente, os seguintes campos e estados serão gradualmente introduzidos à `Reserva`. **(Nenhuma alteração de código será feita nesta fase)**.

### Novos Campos Sugeridos
- `paymentRequired`: boolean;
- `bookingPaymentId`: ObjectId (ref: BookingPayment);
- `termsAcceptanceId`: ObjectId (ref: TermsAcceptance);
- `arrivalToleranceMinutesSnapshot`: number;
- `paymentExpiresAt`: Date;
- `confirmedAt`: Date;
- `noShowMarkedAt`: Date;
- `noShowMarkedBy`: ObjectId (admin ou provider do webhook);
- `cancelledAt`: Date;
- `completedAt`: Date.

### Novos Enum de Status
- **paymentStatus:** `not_required`, `pending`, `paid`, `expired`, `refunded`, `failed`, `manual_review`.
- **status:** `payment_pending`, `confirmed`, `cancelled`, `no_show`, `completed` (substitui 'finalizado'), `expired`, `manual_review`.

### Regras de Negócio do Novo Ciclo
- **Confirmação:** Status `confirmed` exige `paymentStatus = paid` quando `paymentRequired = true`.
- **Liberação:** Status `expired` libera o horário da agenda automaticamente.
- **No-Show:** Só pode ser marcado após o horário agendado + tolerância (`arrivalToleranceMinutesSnapshot`).
- **Manual Review:** Utilizado para pagamentos tardios, disputas, ou falhas no webhook.
- **Ciclo Restrito:** A alteração de estados deve seguir as funções puras de ciclo de vida (state machine) na Policy/Service.
