# Políticas: Expiração, No-Show, Termos e Reembolso (Doodads)

## Expiração da Cobrança e Liberação de Horário (Gate 7)
- O Pix dinâmico gerado expirará em 10 ou 15 minutos (configurável pela barbearia).
- Durante a janela de `payment_pending`, o horário ficará bloqueado para outras pessoas.
- **Se não pago até o `expiresAt`:** O `BookingPayment` transita para `expired`, a Reserva vai para `expired` e o horário é imediatamente liberado.
- Será necessário um *Job (Cron)* futuro (`expirePendingPayments`) periódico e idempotente para limpar orfãos, preservando sempre status pagos/confirmados.
- **Regra:** Nunca confirmar sem pagamento, e não deixar reservas pendentes bloquearem a agenda para sempre.

## Tolerância, No-Show e Chegada (Gate 8)
- A tolerância (`arrivalToleranceMinutes`) geralmente será de 10-15 minutos.
- Esta tolerância deve ser visível ao cliente antes do pagamento.
- Se o cliente chegar além do limite, o operador do app pode marcar o estado como `no_show`.
- Marcar `no_show` exige registro de quem marcou e que horas.
- Reembolso automático para cancelamento ou no-show está bloqueado neste MVP para evitar disputa fiscal. Serão geridos como `manual_review` ou sob política da própria barbearia.

## Aceite Explícito e snapshot (Gate 9)
Antes da geração do Pix e cobrança, é **obrigatório**:
- Checkbox visível e *desmarcado por padrão*: "Li e concordo com as condições de pagamento, confirmação da reserva, tolerância de chegada, cancelamento, reembolso e não comparecimento."
- O botão de pagamento/geração de QR Code fica bloqueado sem esse aceite.
- O sistema registra um `TermsAcceptance` associado à reserva, contendo o snapshot dos valores, do texto aceito e hashes de IP e User-Agent.
- Isso previne litígios no CDC e atende aos princípios de transparência da LGPD.
