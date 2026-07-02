# Especificação: Modelo SaaS, Trial e Fundo de Impacto (Doodads)

## Modelo SaaS para a Barbearia
O Doodads será faturado diretamente contra as barbearias (modelo SaaS/B2B). 
- **Trial:** Cada nova barbearia tem 90 dias de trial gratuito (campo `trialEndsAt`). Durante este período, o acesso é irrestrito.
- **Mensalidade:** Após o trial, o `billingStatus` transita para `trial_expired` e exige a contratação de uma assinatura mensal.
- **Planos & Assinaturas:** Serão criadas entidades como `Plan` e `Subscription` para controlar o acesso SaaS da barbearia à plataforma administrativa.

## Fundo de Impacto Educacional
Parte da **receita auferida pelo Doodads** com as assinaturas SaaS será destinada ao Fundo de Impacto Educacional (que apoiará escolas públicas).
- **Como é calculado:** Uma porcentagem (`impactContributionPercent`) do valor da mensalidade paga pela barbearia alimenta o fundo, gerando um registro no `ImpactLedgerEntry`.
- **Por que NÃO usar lucro da barbearia:** Acompanhar o "lucro líquido" de terceiros é inviável, intrusivo e fiscalmente arriscado.
- **Por que NÃO usar dinheiro do serviço do cliente:** Reter ou descontar porcentagens sobre o corte de cabelo/serviço prestado geraria o modelo de split de pagamento ou intermediação complexa (ex: Stripe Connect), aumentando taxas, exigindo compliance contábil severo e colocando o Doodads como "recebedor" de valores que pertencem à barbearia, criando confusão patrimonial.
