// =============================================================
// 🧭 reserva.routes.ts
// -------------------------------------------------------------
// Define endpoints REST para reservas
// =============================================================


import express from "express";
import Reserva from "../models/Reserva";
import Servico from "../models/Servico";
import { verifyToken, AuthenticatedRequest } from "../middlewares/authMiddleware";
import { generateSlots } from "../utils/generateSlots";

const router = express.Router();

// =============================================================
// 🧾 Criar nova reserva
// -------------------------------------------------------------
router.post("/", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { barbearia, servico, dataHora } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!barbearia || !servico || !dataHora) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Evita duplicidade de horário
    const conflito = await Reserva.findOne({
      barbearia,
      servico,
      dataHora: new Date(dataHora),
      status: { $ne: "cancelado" },
    });

    if (conflito) {
      return res.status(400).json({ error: "Horário já reservado." });
    }

    const novaReserva = new Reserva({
      usuario: req.userId,
      barbearia,
      servico,
      dataHora,
      status: "confirmado",
      valor: 0,
    });

    await novaReserva.save();
    console.log("✅ Reserva criada com sucesso:", novaReserva._id);

    return res.status(201).json(novaReserva);
  } catch (err: any) {
    console.error("❌ Erro ao criar reserva:", err);
    return res.status(500).json({
      error: "Erro interno ao criar reserva.",
      details: err.message,
    });
  }
});

// =============================================================
// 📋 Listar reservas do usuário autenticado
// -------------------------------------------------------------
router.get("/minhas", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const reservas = await Reserva.find({ usuario: req.userId })
      .populate("barbearia", "nome endereco imagem telefone1 telefone2")
      .populate("servico", "nome preco duracaoMin")
      .sort({ dataHora: -1 });

    return res.status(200).json(reservas);
  } catch (err) {
    console.error("❌ Erro ao listar reservas do usuário:", err);
    return res.status(500).json({ error: "Erro interno ao buscar reservas." });
  }
});

// =============================================================
// ⏰ Slots disponíveis para agendamento
// -------------------------------------------------------------
// GET /api/reservas/:id/slots?date=YYYY-MM-DD&servicoId=ID
// =============================================================

router.get("/:id/slots", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, servicoId } = req.query;

    if (!id || id === "undefined") {
      return res.status(400).json({ error: "ID da barbearia inválido." });
    }
    if (!date || !servicoId) {
      return res.status(400).json({ error: "Data e serviço são obrigatórios." });
    }

    const slots = await generateSlots(id, String(servicoId), String(date));
    return res.status(200).json({ date, slots });
  } catch (err: any) {
    console.error("❌ Erro ao gerar slots:", err);
    return res.status(500).json({ error: "Erro interno ao gerar slots." });
  }
});

export default router;
