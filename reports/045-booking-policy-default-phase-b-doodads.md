# Fase B: Booking Policy Default por Barbearia

## 1. Objetivo da Fase
Implementar a criação e recuperação da **BookingPolicy default** (política de reservas e cancelamento) por barbearia. Esta fase cria a camada de repositório e serviço responsável por garantir a existência de uma política de segurança para as reservas, seguindo TDD e a restrição estrita de **não alterar o fluxo público atual**, nem ativar nenhum gateway de Pix real ou frontend.

## 2. Arquivos Criados/Alterados
- `server/repositories/bookingPolicy.repository.ts` (Criado)
- `server/services/bookingPolicy.service.ts` (Criado)
- `server/tests/bookingPolicy.service.test.ts` (Criado)

O arquivo `Reserva.ts` e qualquer controller de rota pública permaneceram inalterados. Não houve modificação em `routes/` ou `client/`.

## 3. Decisões Técnicas e TDD
- **Repositório**: Implementada função de `findActiveByBarbeariaId` (que prioriza a política `isActive: true` usando reverse sort) e a de `create`.
- **Serviço**: Implementado o método `getActiveOrDefaultPolicy`. Ele checa se existe uma política ativa. Se não, instancia uma com os defaults rígidos exigidos, faz uma checagem dupla para mitigar duplicação paralela (evitando complexidades de upsert) e insere.
- **Defaults Seguros Aplicados**:
  - `requirePrepayment`: **false** (por enquanto não exigimos pré-pagamento até plugar o Pix de fato).
  - `paymentExpirationMinutes`: 15.
  - `arrivalToleranceMinutes`: 15.
  - `cancellationWindowHours`: 2.
  - `refundPolicy`: "no_refund_after_window".
  - `noShowPolicy`: "mark_no_show_after_tolerance".

## 4. Testes e Cobertura
Foram criados 3 novos testes na suíte `bookingPolicy.service.test.ts` que validam:
1. Criação da política com defaults exatos quando ela não existe.
2. Reaproveitamento da política ativa, prevenindo duplicidade no banco (`countDocuments`).
3. Respeito aos limites predefinidos pelo model Mongoose (ex: constraints de min/max).

**Resultado Real dos Testes**:
- **Test Suites**: 6 passed, 6 total.
- **Tests**: 44 passed, 44 total.
- **TypeScript**: `npx tsc --noEmit` completado sem erros.

## 5. Auditoria de Secrets e Artefatos
Foram rodados comandos restritivos que atestaram:
- Nenhum `.env` rastreado indevidamente.
- Nenhuma chave secreta em hardcode (a busca com `ripgrep` detectou apenas logs de reports documentais anteriores e chaves mock no `.env.test`).
- Zero instâncias de `.next`, `dist`, `node_modules` subidas para o repositório.

## 6. Escopo Explicitamente Não Ativado (Bloqueios Respeitados)
Nesta fase, sob severa governança:
- O Pix Real, webhooks, geração de QRs, integração com providers, Fundo de Impacto e SaaS billing continuam inativos/inexistentes.
- Não foram criadas rotas que exponham esse serviço para a web pública.
- Não há interrupção ou alteração do fluxo existente de agendamentos de barbearia (o agendamento via app continua do mesmo jeito de antes).

## 7. Decisão
DECISÃO: PHASE B IMPLEMENTADA COM BOOKINGPOLICY DEFAULT POR BARBEARIA, SEM ATIVAÇÃO DE PIX REAL, WEBHOOK, QR REAL, PROVIDER REAL, FRONTEND PÚBLICO OU ALTERAÇÃO DO FLUXO DE RESERVAS. TESTES, TYPESCRIPT E AUDITORIAS PERMANECEM VERDES.
