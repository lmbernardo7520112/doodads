# R206 — SDD — Plano de Ação para Hardening de Cibersegurança — Doodads

Este documento estabelece o plano de ação técnico de cibersegurança e qualidade de código para o aplicativo **Doodads** (Aparatu), adotando a metodologia estrita de **Specification Driven Development (SDD) + TDD + Clean Code + CI/CD**.

---

## 1. Mapeamento de Vulnerabilidades Críticas (Estado Atual)

Uma auditoria inicial profunda no repositório `doodads` identificou os seguintes pontos de falha que devem ser mitigados:

### V1: Segredo JWT Padrão Vulnerável
* **Componente:** `server/middlewares/authMiddleware.ts` e `server/controllers/auth.controller.ts`
* **Comportamento:** O código utiliza o fallback estático `"defaultsecret"` caso a variável `JWT_SECRET` não esteja no ambiente.
* **Ação de Correção:** Abortar a inicialização do servidor se a variável `JWT_SECRET` não estiver definida. Remover qualquer string de segredo estático em texto claro do código-fonte.

### V2: Autopromoção de Privilégios no Cadastro (Mass Assignment / RBAC Bypass)
* **Componente:** `server/controllers/auth.controller.ts` (Endpoint `POST /api/auth/register`)
* **Comportamento:** O campo `tipo` do payload é enviado diretamente para `User.create`.
* **Ação de Correção:** A rota pública de registro deve forçar o tipo a ser estritamente `cliente` no Zod. A criação de patentes privilegiadas (`barbeiro`, `admin`) deve exigir autenticação administrativa e restrição de rota.

### V3: Ausência de Rate Limiting nos Endpoints Críticos
* **Componente:** `server/routes/auth.routes.ts` e `server/routes/reserva.routes.ts`
* **Comportamento:** Sem limitação de requisições. Permite brute-force de senhas e ataques de DoS no agendamento.
* **Ação de Correção:** Adicionar rate limiters com `express-rate-limit` dedicados:
  * `/api/auth/login` e `/api/auth/register`: máx 15 requisições por 15 minutos por IP.
  * `/api/reservas` (criar agendamento): máx 20 requisições por 15 minutos por IP.

### V4: Ausência de Validação de Input e Prevenção contra Injeção NoSQL
* **Componente:** Todos os controladores mutativos.
* **Comportamento:** Os inputs do Express (`req.body`, `req.params`) não passam por sanitização ou validação de tipo Zod.
* **Ação de Correção:** Adicionar middleware `validate(schema)` com schemas Zod. Impedir o uso de objetos no campo `email` para bloquear injeções NoSQL do tipo `{"$gt": ""}`.

---

## 2. Metricas de Qualidade de Código (Complexidade Ciclomática)

O controlador de agendamentos (`server/controllers/reserva.controller.ts`) acumulou múltiplas condicionais aninhadas de tempo e propriedade (cancelamento, pagamento, conflitos de horários), resultando em alta complexidade ciclomática.

### Ações de Clean Code:
1. **Desacoplamento de Lógicas Temporais:** Extrair os cálculos de tempo e regras de corte de cancelamento para funções puras e isoladas em `server/utils/reservaHelpers.ts`.
2. **Maximo de Complexidade Ciclomática:** O limite estrito de complexidade ciclomática por função deve ser **V(G) <= 8**. Funções que excederem o limite devem ser refatoradas.

---

## 3. Plano de Testes (TDD)

Cada barreira de segurança e restrição de contrato deve ser testada. A suite de testes automatizados deverá conter testes para:

| Cenário de Teste | Endpoint | Status Esperado |
|---|---|---|
| Cadastro público forçado a cliente (autopromover a admin deve falhar) | `POST /api/auth/register` | **400 Bad Request** ou **201** com tipo `cliente` |
| Autenticação com JWT falso ou expirado | `GET /api/test/protected` | **401 Unauthorized** |
| Acesso a recurso de outra conta (bypass de ownership) | `GET /api/reservas/:id` | **403 Forbidden** |
| Criação de agendamento sem dados essenciais | `POST /api/reservas` | **400 Bad Request** |
| Tentativa de injeção NoSQL no campo e-mail | `POST /api/auth/login` | **401 Unauthorized** / **400 Bad Request** |
| Estouro de limite no rate limiter | `POST /api/auth/login` | **429 Too Many Requests** |

---

## 4. Pipeline de CI/CD e Governança

Para garantir a qualidade em todas as etapas, as seguintes barreiras de pipeline serão integradas:

1. **Scanner de Segredos (Gitleaks):** Bloqueio de builds se chaves API, tokens JWT ou credenciais MongoDB forem detectados.
2. **Linting Estrito:** Execução do ESLint antes do build de produção.
3. **Execução de Testes Automatizados:** O pipeline de CI/CD deve rodar os testes unitários e de integração de backend/frontend em todas as Pull Requests.

---

## 5. Cronograma Técnico de Execução

```
Fase 1: Configurações Globais (Rate limits, Bypass de Segredos, CORS)
  │
  ├─ Fase 2: Schemas Zod e Proteção contra Mass Assignment (Register, Login, Reservas)
  │
  ├─ Fase 3: Refatoração de Controladores (Clean Code / Complexidade Ciclomática)
  │
  └─ Fase 4: Automação de Testes (TDD) & CI/CD
```

---

_Plano de ação de cibersegurança especificado em 2026-07-01._
