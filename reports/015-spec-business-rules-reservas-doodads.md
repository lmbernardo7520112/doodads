# Especificação de Regras de Negócio: Reservas

## 1. Criação de Reserva
- Cliente autenticado cria reserva para si mesmo;
- Cliente não pode forçar chaves de ownership (é ignorado/bloqueado);
- `barbearia` e `servico` devem existir no banco;
- `servico` deve pertencer à `barbearia`;
- `dataHora` deve ser no futuro (não pode criar no passado);
- Não pode haver conflito de horário (duas reservas confirmadas/pendentes na mesma barbearia e serviço não são suficientes, tem que validar se a barbearia tem o profissional ou conflito de agenda, mas no modelo atual a checagem exata no mesmo minuto já existe, vamos fortalecer para garantir que ao menos a data seja estritamente validada).

## 2. Conflito de Agenda
- Ignora reservas com status `cancelado`.
- Rejeita se já houver reserva no mesmo horário exato (e idealmente deveria considerar duração, mas como `duracaoMin` existe no modelo `Servico`, podemos aprimorar isso se possível ou manter a checagem do slot exato, dado que o `generateSlots` deve ser quem gerencia os slots livres).

## 3. Cancelamento
- Cliente cancela a própria reserva;
- Admin/Barbeiro podem cancelar qualquer uma;
- Bloqueado se a antecedência for menor que `CANCEL_CUTOFF_MINUTES` (padrão 60m), exceto para admin/barbeiro;
- Bloqueado se a reserva já estiver `cancelado` ou `finalizado` ou já estiver paga (`aprovado`).

## 4. Pagamento
- Cliente só paga sua própria reserva;
- Bloqueado se status = `cancelado`;
- Bloqueado se paymentStatus = `aprovado`.

## 5. Status Lifecycle
- `pendente` -> `cancelado` (por usuário ou timeout)
- `pendente` -> `confirmado` (após pagamento)
- `confirmado` -> `finalizado` (pós-serviço)
- `confirmado` -> `cancelado` (sujeito a reembolso, dependendo da regra).

## Ação
- Adicionar validações de existência de `Servico` e pertencimento.
- Bloquear datas no passado.
- Bloquear pagamento se reserva cancelada/finalizada.
- Utilizar AppError para erros de domínio.
