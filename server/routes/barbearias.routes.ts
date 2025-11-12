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

const router = express.Router();

router.get("/", listarBarbearias);
router.get("/:id", obterBarbeariaPorId);

export default router;

