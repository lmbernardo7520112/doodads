//server/routes/pagamento.routes.ts

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { criarCheckout, receberWebhook } from "../controllers/pagamento.controller";

const router = Router();

// Stripe exige RAW body
import bodyParser from "body-parser";

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  receberWebhook
);

router.post("/checkout", authMiddleware, criarCheckout);

export default router;
