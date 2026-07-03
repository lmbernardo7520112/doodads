# Decisão: Models Phase A (Pix Booking)

## Escopo Realizado
Na fase `DOODADS-PIX-BOOKING-MODELS-IMPLEMENTATION-PHASE-A`, os modelos de persistência primários (BookingPayment, BookingPolicy, TermsVersion, TermsAcceptance, BarbeariaPaymentConfig) foram materializados em código Mongoose através de desenvolvimento guiado por testes (TDD).

## Validação e Conformidade
- O modelo `Reserva.ts` original foi mantido intocado, adiando alterações de schema nele apenas quando o serviço requerer no momento de ativação do fluxo.
- Nenhum webhook, API externa, migração ao banco de dados em produção ou credencial foi ativada.
- Todos os testes mantiveram 100% de confiabilidade, e os modelos garantem ausência de retenção incorreta de PII e Segredos.

## Decisão Oficial

DECISÃO: MODELS MONGOOSE MÍNIMOS PARA PIX BOOKING PAYMENT IMPLEMENTADOS EM PHASE A. BOOKINGPAYMENT, BOOKINGPOLICY, TERMSVERSION, TERMSACCEPTANCE E BARBEARIAPAYMENTCONFIG FORAM CRIADOS COM ENUMS, ÍNDICES, VALIDAÇÕES E TESTES. NENHUM FLUXO PIX REAL, WEBHOOK, QR, PROVIDER, FRONTEND, MIGRATION DESTRUTIVA OU SECRET FOI ATIVADO. TESTES E TYPESCRIPT PERMANECEM VERDES.
