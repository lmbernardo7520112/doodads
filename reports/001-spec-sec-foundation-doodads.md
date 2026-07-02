# Specification: Security Foundation (Fase 1)

## Objetivo
Consolidar a fundação de cibersegurança do backend Doodads em modo estrito, eliminando fallbacks inseguros de variáveis de ambiente, implementando validação de entrada robusta (Zod), limitando requisições sensíveis (Rate Limit) e protegendo contra vazamentos de dados (Error Handler).

## Escopo
- Validação estrita e centralizada de variáveis de ambiente (`server/config/env.ts`).
- Remoção do fallback `"defaultsecret"`.
- Middleware de validação com Zod (`server/middlewares/validateRequest.ts`).
- Schemas rigorosos para rotas de autenticação e reserva (`auth.schema.ts`, `reserva.schema.ts`).
- Prevenção ativa de Mass Assignment (ex.: autopromoção para admin/barbeiro) e NoSQL Injection via `.strict()`.
- Implementação de Rate Limiting nas rotas de autenticação (15req/15m) e reservas (20req/15m).
- Error handler global seguro contra vazamento de stack traces em produção.

## Fora de Escopo
- Refatoração profunda ou arquitetural de `reserva.controller.ts` (reservado para Fase 3).
- Implementação de novas features de negócio (pagamentos reais, etc).
- Modificações no frontend, salvo para testes locais.

## Riscos
- Restrição exagerada pode quebrar o client-side (rate limit ou tipagem dos schemas).
- Ausência de `.env` em produção pode impedir a inicialização, o que é um comportamento de falha segura desejado.

## Regras de Segurança (Cybersecurity-First)
- Nenhuma variável de ambiente crítica possui fallback de hardcoded secrets.
- `req.body` de endpoints não-confiáveis deve ser sempre sanitizado e validado.
- Exceções e logs não podem expor stack traces para os clientes nem variáveis sensíveis.

## Critérios de Aceite
- `npm run tsc --noEmit` passa sem erros.
- Auditoria de secrets (grep) não detecta vazamentos.
- Endpoints de autenticação limitados com `express-rate-limit` incluindo headers modernos.
- Schema de reservas valida tipos ObjectIds.
- Controller de autenticação ignora campos nocivos como `tipo: 'admin'`.
