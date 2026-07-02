# Implementation: Clean Code Reserva Controller

## Arquivos Criados
- `server/repositories/reserva.repository.ts`: Mapeia consultas Mongoose encapsuladas (ex: `findMinhas`, `checkBarbeariaExists`, `findConflito`).
- `server/policies/reserva.policy.ts`: Extração das lógicas de autorização `isOwner` e `isPrivileged`.
- `server/services/reserva.service.ts`: Abstração de negócio (criação de reservas, cálculos de data de cutoff, manipulação e atualização de status).

## Arquivos Alterados
- `server/controllers/reserva.controller.ts`: Refatorado pesadamente. Reduzido de 300 linhas misturadas para menos de 100 linhas concisas e controladas (Thin Controller Pattern). Lida puramente com req/res e mapeamento padronizado de erros de domínio usando exceções específicas do Service.

## Regras Preservadas
- Rate Limiting e Validate Request (Zod) intactos nos routes.
- Autenticação JWT estrita não alterada.
- Logica de bloqueio baseada no cutOffTime de 1h garantida no novo Service.

## Complexidade Reduzida
O Controller não possui mais aninhamentos longos (`if/else`) de DB + Regras temporais + Roles + Request Handling. Agora possui complexidade O(1) lendo e escrevendo, isolando try/catch apenas ao Service e formatando resposta de erro centralizada.
