// =============================================================
// 📁 server/App.ts — versão compatível com Jest + Supertest
// =============================================================


import express from "express";
import { config } from "dotenv";
import { connectToMongo } from "./config/db";

config();

const app = express();
app.use(express.json());

// Rotas
import reservaRoutes from "./routes/reserva.routes";
import pagamentoRoutes from "./routes/pagamento.routes";

app.use("/api/reservas", reservaRoutes);
app.use("/api/pagamento", pagamentoRoutes);

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  (async () => {
    await connectToMongo();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })();
}
