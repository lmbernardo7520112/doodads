# Decisão Arquitetural: Pix Booking Domain Models (Doodads)

## O que foi realizado
Na fase `DOODADS-PIX-BOOKING-DOMAIN-MODELS-SPEC` (PR #X), os modelos persistentes mínimos para sustentar o fluxo futuro de agendamentos confirmados por Pix foram rigorosamente especificados. Todo o trabalho ocorreu em **modo documental estrito**.

## Artefatos Gerados
- `036-spec-pix-booking-domain-models-doodads.md`: Auditoria dos modelos atuais e necessidades de evolução do `Reserva`.
- `037-data-model-booking-payment-policy-terms-doodads.md`: Definição schemática minuciosa de `BookingPayment`, `BookingPolicy`, `TermsVersion`, `TermsAcceptance` e `BarbeariaPaymentConfig`.
- `038-migration-plan-pix-booking-models-doodads.md`: Plano de transição em 5 Fases (A até E) focando em estabilidade e o Threat Model completo para prevenir falhas de conciliação ou vazamento de segredos.

## Verificação de Integridade
- **Sem Modificação de Código Real:** Nenhum model Mongoose (ex: `Reserva.ts`) foi alterado no código fonte ainda, atendendo ao princípio de especificar antes de implementar.
- **Segurança (Zero Trust):** O design especifica a abstenção de exposição de `secrets` e uso de hashes para `TermsAcceptance` (compliance LGPD).
- **Sem Integração Prematura:** Nenhum provedor Pix, QR ou webhook real foi instanciado.

## Decisão Oficial
DECISÃO: MODELOS PERSISTENTES MÍNIMOS PARA PIX BOOKING PAYMENT FORAM ESPECIFICADOS SEM IMPLEMENTAÇÃO REAL. BOOKINGPAYMENT, BOOKINGPOLICY, TERMSVERSION, TERMSACCEPTANCE E BARBEARIAPAYMENTCONFIG FORAM DEFINIDOS COM CAMPOS, ENUMS, ÍNDICES, REGRAS DE SEGURANÇA, THREAT MODEL E PLANO DE MIGRAÇÃO INCREMENTAL. NENHUM PIX REAL, WEBHOOK, QR, PROVIDER, SECRET OU MIGRATION FOI ATIVADO.
