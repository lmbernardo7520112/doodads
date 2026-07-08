# Report 088 — Past Reservations UX and Cancel Hardening — Phase E3.2

**Data**: 2026-07-07
**Branch**: `fix/doodads-past-reservations-ux-and-cancel-hardening-phase-e3-2`
**Base**: `fix/doodads-manual-payment-residual-data-and-filters-hardening-phase-e3-1` @ `f42925a`

---

## Objetivo

Resolver as inconsistências temporais e deficiências de UX relacionadas a reservas passadas (reservas cujo horário já ocorreu, mas que permanecem com o status "Pendente" no banco). As principais correções incluem:
1. Impedir o cancelamento de reservas passadas pelo cliente com o erro específico `ALREADY_OCCURRED` no backend.
2. Esconder o botão "Cancelar Reserva" para reservas passadas no frontend.
3. Exibir o badge "Horário já passou" nas reservas passadas que continuam pendentes.
4. Separar e filtrar reservas passadas no frontend (aba "Passadas"), removendo-as da aba "Ativas" e da home, sem efetuar auto-finalizações automáticas ou destrutivas no banco de dados.

---

## Decisões Técnicas de Segurança

- **Sem auto-finalização automática no banco**: Não alteramos os registros para `status: "finalizado"` de forma automatizada no banco de dados no momento da consulta. Isso evita mutating states silenciosos ou corrupção de fluxo sem um operador/scheduler explícito. A separação é puramente visual e lógica no frontend.
- **Sem scheduler/cron/job**: Sem a introdução de rotinas complexas em background para monitorar e transicionar agendamentos vencidos.
- **Diferenciação temporal rigorosa no Backend**: Distinção clara entre:
  1. Reserva passada tentada cancelar por cliente → Erro `ALREADY_OCCURRED`.
  2. Reserva futura dentro do limite mínimo de 60 minutos → Erro `TOO_LATE`.
  3. Reserva futura e elegível para cancelamento → Permitido.

---

## Defeitos Corrigidos

### 1. Backend: Distinção de erros temporais

**Arquivo**: `server/services/reserva.service.ts`

- Calculamos a diferença de tempo (`diffMinutes`) entre a data da reserva (`reserva.dataHora`) e o momento atual (`now`).
- Se `diffMinutes < 0` (no passado) e o usuário **não** for privilegiado (barbeiro, admin, staff):
  - Lançamos o erro `ALREADY_OCCURRED` com a mensagem: `"Esta reserva já ocorreu e não pode ser cancelada."`
- Se `diffMinutes >= 0` e menor que o limite (`cutoffMinutes`), lançamos o erro `TOO_LATE`.
- Usuários privilegiados (como barbeiros e admins) mantêm a autorização para cancelar reservas passadas, conforme as políticas de negócios existentes do estabelecimento.

### 2. Frontend: AppointmentCard atualizado

**Arquivo**: `client/components/ui/AppointmentCard.tsx`

- Criamos `isPast = new Date(reserva.dataHora).getTime() < Date.now()`.
- Atualizamos o guardião `canCancel` para conter `!isPast`. Desta forma, o cliente não visualiza o botão de cancelamento de reservas que já venceram no passado.
- Adicionamos a exibição do badge `"Horário já passou"` (estilo discreto cinza com ícone de relógio) quando `isPast && reserva.status === "pendente"`.
- Ocultamos a exibição da instrução persistente de pagamento manual pendente para agendamentos que já passaram.

### 3. Frontend: Filtros de reservas na Home

**Arquivo**: `client/app/home/page.tsx`

- Filtramos as reservas mostradas na seção de agendamentos rápidos da Home para exibir apenas agendamentos futuros e ativos (`status !== "cancelado"`, `status !== "finalizado"`, e `dataHora > now`).

### 4. Frontend: 4 abas de listagem de reservas

**Arquivo**: `client/app/reservas/page.tsx`

- Implementamos abas de filtro específicas:
  - **Ativas**: Agendamentos com data futura e status não cancelado/finalizado.
  - **Passadas**: Agendamentos com data no passado e status não cancelado.
  - **Canceladas**: Agendamentos com status cancelado.
  - **Todas**: Lista completa sem filtros.
- Atualizamos os badges de contagem de cada aba para refletir em tempo real a quantidade exata de itens correspondente a cada categoria.

---

## Arquivos Alterados

### Backend
| Arquivo | Alteração |
|---|---|
| `server/services/reserva.service.ts` | Adicionado check temporal para lançar `ALREADY_OCCURRED` |
| `server/tests/pastReservationsHardening.phase-e3-2.test.ts` | **NOVO** — Testes de validação temporal de cancelamento e de filtros no frontend |

### Frontend
| Arquivo | Alteração |
|---|---|
| `client/components/ui/AppointmentCard.tsx` | Atualização do `canCancel` com `!isPast` e exibição do badge "Horário já passou" |
| `client/app/home/page.tsx` | Filtragem na Home para apenas agendamentos ativos futuros |
| `client/app/reservas/page.tsx` | 4 abas de filtragem (Ativas, Passadas, Canceladas, Todas) e badges |

---

## Testes

### Novos (14/14 ✅)
- ✅ Cliente tenta cancelar reserva passada → lança `ALREADY_OCCURRED`
- ✅ Cliente tenta cancelar ontem → lança `ALREADY_OCCURRED`
- ✅ Cliente tenta cancelar dentro do cutoff → lança `TOO_LATE`
- ✅ Cliente cancela reserva futura e válida → cancelamento permitido
- ✅ Barbeiro cancela reserva passada → permitido
- ✅ Admin cancela reserva passada → permitido
- ✅ Filtro Ativas: exclui passadas e canceladas
- ✅ Filtro Passadas: inclui passadas não canceladas
- ✅ canCancel é falso para reservas passadas
- ✅ canCancel é verdadeiro para reservas pendentes futuras

### Testes da Suite Completa
- **22 suites, 350/350 testes PASSED** ✅ (100% de sucesso)

---

## Gates e Auditorias

- TypeScript compiler (`npx tsc --noEmit` server): ✅ compilado com sucesso
- Build Next.js (`npx next build` client): ✅ compilado com sucesso
- Auditorias de secrets e dados sensíveis: ✅ 100% limpo
- Auditorias de arquivos temporários, builds e map: ✅ 100% limpo
- Verificação de Stripe/Pix indevidos: ✅ sem menções ou APIs reais

---

## Limitações Remanescentes

1. Apenas reservas não canceladas aparecem na aba "Passadas". Se uma reserva foi cancelada após ter expirado, ela residirá na aba "Canceladas". Isso mantém consistência de status lógica.
2. A transição de agendamentos no banco permanece dependente de ações operacionais das barbearias; o front-end atua como o filtro lógico preventivo.

---

## Decisão

**DECISÃO: PHASE E3.2 IMPLEMENTADA COM HARDENING DE RESERVAS PASSADAS. O BACKEND AGORA DIFERENCIA RESERVA JÁ OCORRIDA DE RESERVA FUTURA DENTRO DA JANELA DE CANCELAMENTO, O FRONTEND OCULTA CANCELAMENTO DE RESERVAS PASSADAS, EXIBE “HORÁRIO JÁ PASSOU”, ORGANIZA RESERVAS EM ATIVAS/PASSADAS/CANCELADAS/TODAS E NÃO AUTO-FINALIZA DADOS NO BANCO. NÃO HOUVE SCHEDULER, CRON, PIX REAL, QR, COPIA-E-COLA, WEBHOOK, PROVIDER, STRIPE, SPLIT OU CUSTÓDIA. TESTES, TYPESCRIPT, BUILD FRONTEND E AUDITORIAS PERMANECEM VERDES.**


---

> **Adendo Phase E3.3 (2026-07-07):** As correções desta fase foram estendidas na Phase E3.3 (Report 091), que incluiu: remoção da reserva fantasma do seed que aparecia com `paymentStatus: "paid"` instantâneo sem passar pelo fluxo manual, correção do seed para criar reservas em estado realista (`status: "pendente"`, `paymentStatus: "pending"`), remoção do endpoint legado `PATCH /:id/pagar` (`pagarReservaSimulado`) e de todo código morto associado (`canPay`, `FORBIDDEN_PAY`).
