# Testes de Regras de Negócio: Reservas

## Cenários Cobertos e Passando (21 no total, todos verdes)

### Criação e Validações
1. Cria reserva válida (`pendente`).
2. **NOVO:** Rejeita criação com data passada.
3. **NOVO:** Rejeita caso a barbearia informada não exista.
4. **NOVO:** Rejeita caso o serviço informado não exista (ou não pertença à barbearia).

### Conflito
5. Impede reserva no mesmo horário ocupado (usando verificação da duração do serviço associado).
6. **NOVO:** Ignora reserva cancelada e permite alocar o mesmo horário para um novo cliente.

### Ownership & Segurança
7. Lista apenas reservas vinculadas ao usuário logado (via `req.user.id`).
8. Bloqueia chamadas se não houver token válido (401).

### Pagamento & Cancelamento
9. Não permite cancelar caso falte menos do que 60 minutos (a menos que seja `admin` ou `barbeiro`).
10. Cancela corretamente com a antecedência devida.
11. **NOVO:** Bloqueia cancelar reserva se já estiver "finalizada" pelo profissional.
12. **NOVO:** Bloqueia cancelar reserva se já estiver paga ("aprovado").
13. Pagamento webhook processa corretamente o checkout stripe e previne pagamento duplicado.

## Métrica
- `npm run test`: 4 suites rodando. 21 testes no total. Todos passaram.
- `npx tsc --noEmit`: 0 erros no TypeScript.
