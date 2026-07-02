# Decisão: Endurecimento das Regras de Negócio de Reservas

As regras de negócio associadas à engine de agendamento foram testadas, implementadas e auditadas.

### 1. Auditoria
- Não existem `node_modules` nem arquivos de build no radar do Git. Se reapareceram nos relatórios do Git cache, já foram limpos novamente no PR.
- Não existem `.env` nem senhas hardcoded expostas em código.

### 2. Padrões de Projeto (Clean Code)
- A complexidade do Controller não aumentou. Toda regra de transição de estado e validação de domínio foi internalizada no `ReservaService` lançando instâncias de `AppError`.
- O `ReservaRepository` absorveu lógicas adicionais do banco (como validação de relação entre barbearia e serviço).

### 3. Veredito Final
DECISÃO: REGRAS DE NEGÓCIO DE RESERVAS ENDURECIDAS. CRIAÇÃO, CONFLITO DE AGENDA, OWNERSHIP, CANCELAMENTO, PAGAMENTO E STATUS LIFECYCLE FORAM VALIDADOS POR TESTES. CONTROLLER PERMANECE FINO, SERVICE/POLICY/REPOSITORY PRESERVAM SEPARAÇÃO DE RESPONSABILIDADES, TYPESCRIPT ESTÁ VERDE E NÃO HÁ SECRETS OU ARTEFATOS RASTREADOS. GO PARA MERGE.
