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
} from "../controllers/reserva.controller";
import generateSlots from "../utils/generateSlots";

const router = Router();

router.post("/", authMiddleware, criarReserva);
router.get("/minhas", authMiddleware, listarMinhasReservas);
router.patch("/:id/cancelar", authMiddleware, cancelarReserva);

// rota de geração de horários
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
