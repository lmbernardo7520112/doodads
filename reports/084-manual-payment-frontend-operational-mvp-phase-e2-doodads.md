# 084 — Manual Payment Frontend Operational MVP Phase E2 — Doodads

## Objetivo
Implementar a interface frontend operacional mínima para manual payments, permitindo que funcionário/barbeiro visualize agendamentos e pagamentos pendentes da sua barbearia e execute as ações protegidas do backend (confirmar recebimento e expirar pagamento vencido). Além disso, garantir que o cliente crie reservas e veja os status corretamente atualizados após ações administrativas.

## Estado Inicial
O backend possuía suporte a manual payments (confirmação manual, expiração manual, presenters PT-BR, ownership, bloqueios de clientes), mas não havia endpoint ou interface frontend para listagem dos pagamentos da barbearia. O cliente podia criar reservas e ver os status, mas o React sofria um erro de renderização de Hooks ao sair/entrar ou na navegação, bloqueando a UI.

## Decisão de Implementação
**Frontend + Endpoint Mínimo de Listagem**: Foi necessário criar o endpoint `GET /api/barbearias/:barbeariaId/pagamentos-manuais` no backend para expor de forma segura as reservas e pagamentos pendentes da barbearia do barbeiro logado. A decisão baseou-se estritamente na Spec recuperada D9 (relatório 079).

## Arquivos Alterados / Criados

### Backend (server)
- `server/routes/barbearias.routes.ts`: Registro da rota de listagem de pagamentos manuais.
- `server/controllers/bookingPaymentManual.controller.ts`: Implementação do método `listarPagamentosManuaisBarbearia` com validação strict via Zod.
- `server/services/bookingPaymentManual.service.ts`: Lógica de listagem com verificação de ownership e populamento seguro da reserva, serviço e cliente.
- `server/App.ts`: Registro das rotas de barbearia para o ambiente de testes.
- `server/tests/bookingPaymentManualList.route.test.ts` *(Novo)*: Suíte de testes de integração com 9 casos de teste para a listagem.

### Frontend (client)
- `client/components/BarberDashboard.tsx` *(Novo)*: Componente de painel operacional com avisos de segurança, filtros por status, listagem de agendamentos e botões administrativos ("Confirmar recebimento" / "Marcar como expirado").
- `client/app/home/page.tsx`: Importação e renderização condicional do `BarberDashboard` para o barbeiro, corrigindo a ordem de chamada dos React Hooks.
- `client/app/page.tsx`: Correção correspondente da ordem de execução de hooks e renderização condicional do painel.
- `client/components/ui/ReservaModal.tsx`: Redirecionamento automático do cliente para a rota `/reservas` após agendamento bem-sucedido (com ou sem pré-pagamento Pix), resolvendo cache estático de listagem.

---

## Telas Criadas/Alteradas

### Painel Operacional do Barbeiro
Visualizado após login por usuários do tipo `"barbeiro"`.
- Exibe o nome da barbearia.
- Alerta visual instrutivo enfatizando que o Doodads não processa Pix e que o barbeiro deve conferir o saldo na conta bancária antes de confirmar.
- Abas/Filtros de status de pagamento: **Pendentes**, **Confirmados**, **Expirados** e **Todos**.
- Cards de agendamento detalhando o nome do cliente, telefone, serviço, valor e data/hora.
- Botão preto primário **"Confirmar recebimento"** se `canConfirm` for true (solicita confirmação de diálogo antes de enviar).
- Botão vermelho **"Marcar como expirado"** se `canExpire` for true (pagamentos pendentes vencidos).

---

## Rotas Backend Usadas
- `GET /api/barbearias/:barbeariaId/pagamentos-manuais` *(Novo)*: Listagem dos pagamentos manuais com paginação e filtros.
- `PATCH /api/reservas/pagamento-manual/:bookingPaymentId/confirmar`: Confirma o pagamento no banco (paid/confirmed).
- `PATCH /api/reservas/pagamento-manual/:bookingPaymentId/expirar`: Marca o pagamento pendente vencido como expirado.

---

## Regras de Autorização / Ownership
A rota de listagem e as ações de mutação de pagamento exigem autenticação e validação no Application Service:
- **Cliente**: 403 Forbidden em qualquer rota de barbearia/pagamentos.
- **Barbeiro**: Apenas se pertencer à barbearia correspondente (`barbearia.barbeiro === userId`). Se não, 403 Forbidden.
- **Admin**: Acesso total a qualquer barbearia.
- **Sem token**: 401 Unauthorized.

---

## Comportamento por Papel

- **Cliente**: Vê a home de agendamentos normal. Cria reservas com aceite de termos, vê a instrução Pix estática, é redirecionado para `/reservas` e vê o status correspondente (Badge amarelo para "Aguardando pagamento Pix", verde para "Pagamento confirmado", vermelho para "Pagamento expirado"). Não visualiza botões de ação do barbeiro.
- **Barbeiro**: Acessa o Painel Operacional diretamente em `/home` e gerencia as reservas de sua barbearia com ações de confirmação e expiração.

---

## Ausência de Integrações Reais (Segurança Financeira)
O Doodads não possui qualquer mecanismo financeiro real:
- Sem Pix real / webhook / QR Code / copia-e-cola.
- Sem Stripe Checkout / Connect / Splits / Custódia.
- Sem chaves Pix ou secrets de provedores.

---

## Evidências Visuais e Gravações
Toda a interação foi validada no Chrome local via gravação automatizada (`client_actions_test_1783364806129.webp`) e screenshots complementares em `artifacts/screenshots/`.

---

## Testes Automatizados (Backend)
Foi criada a suíte `server/tests/bookingPaymentManualList.route.test.ts` com 9 casos de teste:
- Sem token -> 401
- Cliente tentando listar -> 403
- Barbeiro sem ownership -> 403
- Barbeiro proprietário lista com sucesso -> 200 (valida presenters PT-BR, dados populados e campos proibidos)
- Filtros por status e overdueOnly funcionais
- Zod schema strict (rejeita campos extras na query)

**Resultado Geral dos Testes**:
`Test Suites: 19 passed, 19 total`
`Tests:       321 passed, 321 total`
`Time:        11.564 s`
**100% dos testes do backend verdes.**

---

## TypeScript (Gates)
- Backend: `npx tsc --noEmit` -> **Zero erros**
- Frontend: `npm run build` -> **Zero erros**

---

## Auditorias de Segurança
- **Artifacts indesejados**: CLEAN (nenhum node_modules, build ou dist versionado)
- **Segredos/.env**: CLEAN
- **Secrets expostos**: CLEAN
- **Pix/Stripe reais no código**: CLEAN (nenhum provedor real ou webhook financeiro)

---

## Limitações Remanescentes
- O status principal da reserva é mantido como "pendente" para manter compatibilidade com o fluxo legado de agendamentos. A alteração automática do status da reserva para "confirmado" (pós-pagamento) ou "cancelado" (pós-expiração) fica delegada para fases futuras.

---

## Decisão GO/NO-GO

### ✅ GO
**DECISÃO: PHASE E2 IMPLEMENTADA COM FRONTEND OPERACIONAL PARA MANUAL PAYMENTS.**

O fluxo de pagamento manual está totalmente operacional e integrado no frontend do Doodads:
1. O cliente agenda, aceita os termos e visualiza a tela pós-reserva com instruções Pix estáticas da barbearia.
2. O agendamento aparece na listagem do cliente como "Aguardando pagamento Pix" e o redirecionamento pós-sucesso garante atualização imediata.
3. O barbeiro, ao logar, visualiza o Painel Operacional, acompanha a listagem de pagamentos manuais, e pode confirmar recebimento (após verificar seu extrato) ou marcar pagamentos vencidos como expirados.
4. As regras de autorização, ownership e esquemas strict do backend garantem a proteção dos dados.
5. Os testes do backend (321/321) e o build do frontend estão totalmente verdes e estáveis.
