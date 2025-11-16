// =============================================================
// 🚀 index.ts — versão final corrigida
// =============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import { connectToMongo } from "./config/db";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import barbeariaRoutes from "./routes/barbearias.routes";
import reservaRoutes from "./routes/reserva.routes";
import servicoRoutes from "./routes/servico.routes";
import pagamentoRoutes from "./routes/pagamento.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// =============================================================
// 🌐 CORS
// =============================================================
app.use(
  cors({
    origin: [FRONTEND_URL],
    credentials: true,
  })
);

// =============================================================
// ⭐ WEBHOOK STRIPE — DEVE VIR ANTES DE express.json()
// =============================================================
app.post(
  "/api/pagamento/webhook",
  bodyParser.raw({ type: "application/json" })
);

// =============================================================
// Agora é seguro ativar express.json()
// =============================================================
app.use(express.json());

// =============================================================
// 🧠 MongoDB
// =============================================================
connectToMongo();

// =============================================================
// 🧾 Rotas normais
// =============================================================
app.use("/api/auth", authRoutes);
app.use("/api/test", protectedRoutes);
app.use("/api/barbearias", barbeariaRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/servicos", servicoRoutes);

// =============================================================
// 💳 Pagamentos (checkout)
// =============================================================
app.use("/api/pagamento", pagamentoRoutes);

// =============================================================
// 🩺 Health
// =============================================================
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

// =============================================================
// 🚀 Inicialização
// =============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
});
