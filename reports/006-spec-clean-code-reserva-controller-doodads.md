# Specification: Clean Code Reserva Controller

## Problema
O arquivo `server/controllers/reserva.controller.ts` acumulou regras de negócios (verificação de cutoff time, validação de conflito), lógica de controle de permissões e queries no banco de dados. Isso criou uma arquitetura fat-controller (complexidade ciclomática elevada, com mais de 300 linhas), dificultando a escalabilidade e reaproveitamento.

## Arquitetura Alvo
- **Controller:** Extremamente fino, atua apenas parseando requests e emitindo HTTP responses. Delega a execução a Services.
- **Service:** Agrupa regras de negócio puras (validação de horário limite, checagem de regras financeiras ou lógicas temporais) que antes estavam no Controller.
- **Policy:** Regras estritas de autorização baseadas em ownership ou permissões (ex: se é barbeiro/admin).
- **Repository:** Isola as chamadas do Mongoose. Nenhuma query DB vaza para Controller ou Service.

## Escopo
- `reserva.controller.ts`
- `reserva.service.ts`
- `reserva.repository.ts`
- `reserva.policy.ts`

## Fora de Escopo
- Modificação no Frontend.
- Criação de features novas.
- Refatoração do `pagamento.controller.ts`.

## Critérios de Aceite
- Todos os 15 testes de integração existentes (PRD-004 e PRD-006) passam sem falhas.
- `npx tsc --noEmit` verde.
- Ausência de queries mongoose (`find`, `create`, `save`) diretamente no Controller ou Service.
- Nenhuma chave secreta vazada.
