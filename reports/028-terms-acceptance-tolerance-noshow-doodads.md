# Políticas e Aceite: Tolerância e No-Show (Doodads)

## Transparência Pré-Pagamento (CDC e LGPD)
O Código de Defesa do Consumidor e a LGPD exigem transparência e consentimento claro. O Doodads fornecerá à barbearia a capacidade de definir uma `BarbeariaBookingPolicy`.

### Tolerância e No-Show
- **Tolerância (`arrivalToleranceMinutes`):** O cliente deve saber exatamente qual o atraso máximo permitido.
- **Não Comparecimento (No-Show):** Se o cliente não chegar após a tolerância, o status da reserva vai para `no_show`.
- **Cancelamento e Reembolso (`cancellationWindowHours`):** Especificará o limite de horas para cancelamento com devolução automática ou revisão manual.

## Persistência do Aceite (`TermsAcceptance`)
Antes de gerar o Pix, o cliente deve marcar um **checkbox obrigatório e não pré-selecionado** concordando com as políticas específicas. 
Para prova de concordância, o sistema grava um *snapshot*:
- `termsVersionId`
- `acceptedAt`
- `serviceSnapshot` (valor, tolerância, política resumida do exato momento)
- Hash do IP e do User-Agent (minimização de dados pessoais).

Esta abordagem garante validade evidencial inicial e protege a barbearia contra chargebacks por no-show, porém toda a redação final da política precisará de **validação jurídica** prévia.
