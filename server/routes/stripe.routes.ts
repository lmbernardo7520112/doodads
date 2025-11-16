import { Router } from "express";
import { stripeWebhook } from "../controllers/stripe.controller";

const router = Router();

// ⚠️ NÃO usar bodyParser aqui
router.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
