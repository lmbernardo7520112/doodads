// =============================================================
// 📁 server/App.ts — versão compatível com Jest + Supertest
// =============================================================

import express from "express";
import { config } from "dotenv";
import { connectToMongo } from "./config/db";

config();

const app = express();
app.use(express.json());

// Rotas reais
import reservaRoutes from "./routes/reserva.routes";
app.use("/api/reservas", reservaRoutes);

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// 🚀 NÃO inicia o servidor aqui
// Exporta somente o app para testes
export default app;

// Apenas inicia o servidor se NÃO estiver em ambiente de teste
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  (async () => {
    await connectToMongo();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })();
}
