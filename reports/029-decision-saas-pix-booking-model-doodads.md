# Decisão de Arquitetura de Negócio e Agendamentos (Doodads)

## Auditoria (Gate 2)
Foi identificada uma ausência sistêmica de controle multi-tenant de faturamento, trials SaaS e políticas robustas de cancelamento/no-show no estado atual do Doodads (focado antes apenas na mecânica do Stripe em conta única).

## DECISÃO ESPERADA (Gate 10)
**DECISÃO:** O MODELO DOODADS DEVE SEPARAR RECEITA SAAS DA PLATAFORMA E PAGAMENTO DO SERVIÇO DA BARBEARIA. A BARBEARIA USA O APP GRATUITAMENTE POR 90 DIAS E DEPOIS PAGA MENSALIDADE AO DOODADS; PARTE DESSA RECEITA DA PLATAFORMA ALIMENTA O FUNDO DE IMPACTO EDUCACIONAL. O CLIENTE FINAL PAGA O SERVIÇO DIRETAMENTE À BARBEARIA, PREFERENCIALMENTE VIA PIX COBRANÇA/QR DINÂMICO, E A RESERVA SÓ É CONFIRMADA APÓS PAGAMENTO. POLÍTICA DE TOLERÂNCIA, CANCELAMENTO, NO-SHOW E ACEITE EXPLÍCITO DEVEM SER EXIBIDOS ANTES DO PAGAMENTO E PERSISTIDOS COM SNAPSHOT DE TERMOS. NENHUMA COBRANÇA REAL FOI ATIVADA NESTA FASE.

## Próximos Passos
O próximo esforço prático deve mirar a Fase DOODADS-PIX-BOOKING-PAYMENT-SPEC, para especificar os contratos, provedores (gateway) e o comportamento dos webhooks de idempotência do Pix.
