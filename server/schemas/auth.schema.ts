import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    nomeCompleto: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito grande"),
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(100, "Senha muito grande"),
    telefone: z.string().trim().optional(),
  }).strict(), // Bloqueia injeção NoSQL rejeitando campos desconhecidos/objetos injetados
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    senha: z.string().min(1, "A senha é obrigatória"),
  }).strict(),
});
