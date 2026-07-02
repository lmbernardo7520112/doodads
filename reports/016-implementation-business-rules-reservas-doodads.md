# Implementação das Regras de Negócio: Reservas

## Alterações Realizadas

### 1. Novo Erro de Domínio (`AppError`)
Criamos `server/errors/AppError.ts` para padronizar erros lançados pelo `ReservaService`, com `statusCode` e `code`. O `reserva.controller.ts` agora captura essa instância e devolve as mensagens corretamente para a API de forma segura.

### 2. Hardening na Criação (`ReservaService.criarReserva`)
- Validação se a data não está no passado.
- Checagem da existência da barbearia.
- **NOVO:** Checagem da existência do `servico` E se ele pertence à respectiva barbearia via `ReservaRepository.checkServicoExists`.
- **NOVO:** A verificação de conflitos agora considera o slot dinâmico, simulando `[dataHora, dataHora + duracaoMin)` extraindo a duração do objeto Serviço.

### 3. Hardening no Cancelamento (`ReservaService.cancelarReserva`)
- Bloqueado o cancelamento caso a reserva já esteja `finalizado` ou com pagamento `aprovado`.

### 4. Controller Limpo
As regras foram aplicadas no Service e o Repository gerencia o acesso ao BD. O Controller apenas acopla o `mapError` que traduz falhas para os status 400, 403, 404 e 409.
