// =============================================================
// 🧭 barbearia.routes.ts
// -------------------------------------------------------------
// Define endpoints REST para barbearias
// =============================================================

import express from "express";
import {
  listarBarbearias,
  obterBarbeariaPorId,
} from "../controllers/barbearia.controller";
import { listarPagamentosManuaisBarbearia } from "../controllers/bookingPaymentManual.controller";
import authMiddleware from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", listarBarbearias);
router.get("/:id", obterBarbeariaPorId);
router.get("/:barbeariaId/pagamentos-manuais", authMiddleware, listarPagamentosManuaisBarbearia);

export default router;

