// =============================================================
// 🚀 index.ts
// -------------------------------------------------------------
// Servidor principal Express + Mongo + Auth (com CORS habilitado)
// =============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToMongo } from "./config/db";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import barbeariaRoutes from "./routes/barbearias.routes";
import reservaRoutes from "./routes/reserva.routes";
import servicoRoutes from "./routes/servico.routes";
 

// =============================================================
// 🧩 Configuração inicial
// =============================================================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// =============================================================
// 🌐 Middlewares globais
// =============================================================

// Permite requisições do frontend (Next.js local ou produção)
app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true, // Permite envio de cookies e headers
  })
);

// Permite JSON no corpo das requisições
app.use(express.json());

// =============================================================
// 🧠 Conexão com o MongoDB
// =============================================================
connectToMongo();

// =============================================================
// 🧾 Rotas principais
// =============================================================
app.use("/api/auth", authRoutes);
app.use("/api/test", protectedRoutes);
app.use("/api/barbearias", barbeariaRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/servicos", servicoRoutes);
// =============================================================
// 🩺 Rota de diagnóstico opcional
// =============================================================
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "Servidor em execução ✅" });
});

// =============================================================
// 🚀 Inicialização
// =============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 CORS habilitado para: ${FRONTEND_URL}`);
});
