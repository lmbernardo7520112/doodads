// =============================================================
// 🚀 index.ts — versão final corrigida
// =============================================================

// =============================================================
// 🚀 index.ts — versão final corrigida e segura
// =============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import { env } from "./config/env";

import { connectToMongo } from "./config/db";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import barbeariaRoutes from "./routes/barbearias.routes";
import reservaRoutes from "./routes/reserva.routes";
import servicoRoutes from "./routes/servico.routes";
import pagamentoRoutes from "./routes/pagamento.routes";
import voiceRoutes from "./routes/voice.routes"; // Added this line
import requestLogger from "./middlewares/requestLogger";

// Configuração já feita no env.ts

const app = express();
const PORT = env.PORT;
const FRONTEND_URL = env.FRONTEND_URL;

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
// ❗ REMOVIDO do index.ts
// ❌ app.post("/api/pagamento/webhook", bodyParser.raw(...))
// O webhook REAL e CORRETO já está em pagamento.routes.ts
// =============================================================

// =============================================================
// 💳 Pagamentos — inclui /checkout e /webhook
// MOVIDO para antes do express.json() para garantir RAW body no webhook
// =============================================================
app.use("/api/pagamento", pagamentoRoutes);

// =============================================================
// Agora é seguro ativar express.json()
// (O webhook com RAW body está em pagamento.routes.ts)
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
app.use("/api/voice", voiceRoutes);

// logger deve ser aplicado após rotas críticas
app.use(requestLogger);



// =============================================================
// 🩺 Health
// =============================================================
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

// =============================================================
// 🛡️ Global Error Handler (Seguro contra vazamentos)
// =============================================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled Error:", err.message || err);
  
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Payload malformado." });
  }

  // Previne vazamento de stack traces e dados sensíveis
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: env.NODE_ENV === "production" ? "Erro interno no servidor." : err.message || "Erro interno.",
  });
});

// =============================================================
// 🚀 Inicialização
// =============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
});
