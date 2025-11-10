// =============================================================
// 🧪 protected.routes.ts
// -------------------------------------------------------------
// Rotas de teste para verificar autenticação e roles dinâmicas.
// =============================================================

import express from "express";
import { verifyToken, requireRole } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * 🧱 Teste 1: rota protegida genérica
 */
router.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({ message: "✅ Token válido. Acesso autorizado." });
});

/**
 * 🧑‍💼 Teste 2: apenas administradores
 */
router.get("/admin", verifyToken, requireRole("admin"), (req, res) => {
  res.status(200).json({ message: "✅ Acesso permitido (Admin)." });
});

/**
 * ✂️ Teste 3: apenas barbeiros
 */
router.get("/barbeiro", verifyToken, requireRole("barbeiro"), (req, res) => {
  res.status(200).json({ message: "✅ Acesso permitido (Barbeiro)." });
});

/**
 * 👤 Teste 4: apenas clientes
 */
router.get("/cliente", verifyToken, requireRole("cliente"), (req, res) => {
  res.status(200).json({ message: "✅ Acesso permitido (Cliente)." });
});

export default router;
