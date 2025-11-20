//server/routes/pagamento.routes.ts

// =============================================================
// pagamento.routes.ts — versão final corrigida
// =============================================================

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { criarCheckout, receberWebhook } from "../controllers/pagamento.controller";
import bodyParser from "body-parser";
import Reserva from "../models/Reserva";

const router = Router();

// =============================================================
// ⚠️ WEBHOOK Stripe — PRECISA do bodyParser.raw()
// NÃO pode usar express.json() aqui
// =============================================================
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  receberWebhook
);

// =============================================================
// 💳 Checkout normal — exige autenticação
// =============================================================
router.post("/checkout", bodyParser.json(), authMiddleware, criarCheckout);



export default router;
