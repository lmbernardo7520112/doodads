# Merge do PR #4

## Informações do Merge
- **ID do Pull Request:** #4
- **Branch Origem:** `security/doodads-reserva-business-rules-hardening`
- **Hash do Merge:** `31811d6`
- **Título:** feat(reservas): harden booking business rules

## Arquivos Integrados
Os seguintes arquivos sofreram consolidação de lógica de domínio seguro:
- `server/controllers/reserva.controller.ts` (mantido fino, convertendo erros customizados)
- `server/services/reserva.service.ts` (concentração das validações rigorosas)
- `server/repositories/reserva.repository.ts` (isolamento de MongoDB)
- `server/errors/AppError.ts` (nova engine de tradução de falhas HTTP-agnóstica)
- `server/tests/reserva.routes.test.ts` e `reserva.routes.full.test.ts` (ampliação massiva de suites)

## Auditoria de Artefatos Pós-Merge
O tracking indevido de `.next`, `dist`, e `node_modules` continua combatido, bem como qualquer exposição acidental de strings como "defaultsecret". A master (main) está imaculada.
