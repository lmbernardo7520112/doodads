// =============================================================
// 🔐 auth.routes.ts
// -------------------------------------------------------------
// Define endpoints de autenticação: registro, login e perfil.
// =============================================================

import express from "express";
import { register, login, getProfile, refreshToken } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/authMiddleware";
import rateLimit from "express-rate-limit";
import { validateRequest } from "../middlewares/validateRequest";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

// =============================================================
// 🛡️ Rate Limiter de Autenticação (Fase 1)
// Limita a 15 requisições a cada 15 minutos por IP
// =============================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de autenticação. Tente novamente em 15 minutos." }
});

const router = express.Router();

router.post("/register", authLimiter, validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.get("/profile", verifyToken, getProfile);
router.post("/refresh", authLimiter, refreshToken);

export default router;

