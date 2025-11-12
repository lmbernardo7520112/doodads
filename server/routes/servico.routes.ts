import express from "express";
import { listarServicosPorBarbearia } from "../controllers/servico.controller";

const router = express.Router();

router.get("/:id", listarServicosPorBarbearia);

export default router;
