// =============================================================
// 🚀 index.ts
// Servidor principal Express + Mongo + Auth + Pagamentos
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
// ⭐ WEBHOOK STRIPE → precisa de RAW e deve ser registrado ANTES de express.json()
// =============================================================
app.post(
  "/api/pagamento/webhook",
  bodyParser.raw({ type: "*/*" }), // aceita qualquer tipo enviado pelo Stripe
  (req, res, next) => {
    (req as any).rawBody = req.body; // salva para uso no controller
    next();
  }
);

// =============================================================
// Agora é seguro habilitar express.json()
// (isso NÃO afeta o webhook porque ele já foi registrado antes)
// =============================================================
app.use(express.json());

// =============================================================
// 🧠 Conexão com MongoDB
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

// ⭐ Checkout + Webhook + Pagamento
// (O webhook já foi registrado acima manualmente)
// evitar duplicação
app.use("/api/pagamento", pagamentoRoutes);

// =============================================================
// 🩺 Health Check
// =============================================================
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "Servidor em execução ✅" });
});

// =============================================================
// 🚀 Inicialização
// =============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌍 CORS habilitado para: ${FRONTEND_URL}`);
});

export default app;
