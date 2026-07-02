// =============================================================
// 🧭 reserva.routes.ts
// -------------------------------------------------------------
// Define endpoints REST para reservas
// =============================================================

import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import {
  criarReserva,
  listarMinhasReservas,
  cancelarReserva,
  pagarReservaSimulado,
  getReservaById,
} from "../controllers/reserva.controller";
import generateSlots from "../utils/generateSlots";
import rateLimit from "express-rate-limit";
import { validateRequest } from "../middlewares/validateRequest";
import { criarReservaSchema } from "../schemas/reserva.schema";

// =============================================================
// 🛡️ Rate Limiter de Reservas (Fase 1)
// Limita a 20 criações de reservas a cada 15 minutos por IP
// =============================================================
const reservaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas reservas criadas. Tente novamente em 15 minutos." }
});

const router = Router();

router.post("/", authMiddleware, reservaLimiter, validateRequest(criarReservaSchema), criarReserva);
router.get("/minhas", authMiddleware, listarMinhasReservas);

// ⬅️ NOVO ENDPOINT — ESSENCIAL PARA O PAGAMENTO-SUCESSO
router.get("/:id", authMiddleware, getReservaById);

router.patch("/:id/cancelar", authMiddleware, cancelarReserva);

// ⚠️ Pagamento simulado (dev)
router.patch("/:id/pagar", authMiddleware, pagarReservaSimulado);

// Slots disponíveis
router.get("/:barbeariaId/slots", async (req, res) => {
  const { barbeariaId } = req.params;
  const { date, servicoId } = req.query;

  const result = await generateSlots({
    barbeariaId,
    servicoId: String(servicoId),
    date: String(date),
  });

  return res.json(result);
});

export default router;

