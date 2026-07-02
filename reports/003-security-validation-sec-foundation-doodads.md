# Security Validation: Security Foundation (Fase 1)

## Mass Assignment e NoSQL Injection
Ambos os schemas (auth e reserva) estão configurados com o modificador `.strict()`. Isso previne que usuários maliciosos passem payloads injetados com propriedades extras (ex.: `tipo: "admin"`, `$set: {}`, `role: 1`), pois o Zod falhará imediatamente. Para o schema de Auth, a propriedade `tipo` foi removida da interface pública e forçada estritamente como `"cliente"` pelo backend.

## Env Secrets
O projeto não tem mais a variável `process.env.JWT_SECRET || "defaultsecret"`. O segredo deve ser alimentado através do servidor de hospedagem. Falhas em instanciar `JWT_SECRET` derrubarão o Node.js. 

## Rate Limiter
Foi introduzido um middleware limitador na memória (usando `express-rate-limit`) que previne Brute Force e Bot Spam em criação de reservas. 

## Tratamento de Erros Globais
Erros nativos que não passam pela rota não irão vazar.

## Auditoria de `.env`
O comando `git ls-files | grep -E "(^|/)\.env$|\.env\."` constatou que a raiz do projeto não contem arquivos de credenciais acidentalmente hospedados no versionamento. O `.gitignore` continua funcional.

## Testes Realizados
- `tsc --noEmit` completou com êxito demonstrando 0 falhas estáticas.
- A auditoria `grep` garantiu 0 retornos no rastreio por chaves vazadas nas origens de repositório.
