import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET é obrigatório para assinar tokens."),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY é obrigatória."),
  FRONTEND_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ ERRO FATAL: Variáveis de ambiente inválidas ou ausentes.");
  const errorPaths = _env.error.issues.map((issue) => issue.path.join("."));
  console.error("Campos problemáticos:", errorPaths.join(", "));
  process.exit(1);
}

// Em produção, exigir explicitamente FRONTEND_URL
if (_env.data.NODE_ENV === "production" && !_env.data.FRONTEND_URL) {
  console.error("❌ ERRO FATAL: FRONTEND_URL não definido em ambiente de produção.");
  process.exit(1);
}

// Configuração segura do FRONTEND_URL com base no ambiente
export const env = {
  ..._env.data,
  FRONTEND_URL: _env.data.FRONTEND_URL || (_env.data.NODE_ENV === "production" ? "" : "http://localhost:5173"),
};
