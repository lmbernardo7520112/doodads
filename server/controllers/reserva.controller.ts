// =============================================================
// 📅 server/controllers/reserva.controller.ts
// -------------------------------------------------------------
// Controla CRUD de reservas (agendamentos)
// =============================================================

import { Request, Response } from "express";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";

// =============================================================
// 🔹 GET /reservas  → lista geral
// =============================================================
export const listarReservas = async (_req: Request, res: Response) => {
  try {
    const reservas = await Reserva.find()
      .populate("barbearia", "nome endereco imagem")
      .populate("usuario", "nomeCompleto email")
      .sort({ dataHora: -1 });

    return res.status(200).json(reservas); // sempre array
  } catch (error) {
    console.error("❌ Erro ao listar reservas:", error);
    return res.status(500).json({ message: "Erro ao listar reservas." });
  }
};

// =============================================================
// 🔹 GET /reservas/minhas  → lista SÓ DO USUÁRIO LOGADO
// =============================================================
export const listarMinhasReservas = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const reservas = await Reserva.find({ usuario: usuarioId })
      .populate("barbearia", "nome imagem telefone1")
      .populate("servico", "nome preco duracaoMin")
      .sort({ dataHora: -1 });

    return res.status(200).json(reservas);
  } catch (error) {
    console.error("❌ Erro ao listar minhas reservas:", error);
    return res.status(500).json({ message: "Erro ao listar reservas do usuário." });
  }
};

// =============================================================
// 🔹 POST /reservas  → criar reserva
// =============================================================
export const criarReserva = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const { barbearia, servico, dataHora, valor } = req.body;

    if (!barbearia || !servico || !dataHora) {
      return res.status(400).json({ message: "Dados incompletos para criar reserva." });
    }

    const barbeariaExiste = await Barbearia.findById(barbearia);
    if (!barbeariaExiste) {
      return res.status(404).json({ message: "Barbearia não encontrada." });
    }

    // Verificar conflito de horário
    const conflito = await Reserva.findOne({
      barbearia,
      servico,
      dataHora,
      status: { $ne: "cancelado" },
    });

    if (conflito) {
      return res.status(409).json({ message: "Horário já reservado." });
    }

    const reserva = await Reserva.create({
      usuario: usuarioId,
      barbearia,
      servico,
      dataHora,
      valor,
      status: "pendente", // PRD-004
    });

    console.log("✅ Reserva criada com status 'pendente':", reserva._id);

    return res.status(201).json({
      message: "Reserva criada com sucesso!",
      reserva,
    });
  } catch (error) {
    console.error("❌ Erro ao criar reserva:", error);
    return res.status(500).json({ message: "Erro ao criar reserva." });
  }
};

// =============================================================
// 🔹 GET /reservas/:id  → obter detalhes
// =============================================================
export const obterReservaPorId = async (req: Request, res: Response) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
      .populate("barbearia", "nome endereco imagem")
      .populate("usuario", "nomeCompleto email")
      .populate("servico", "nome preco duracaoMin");

    if (!reserva) {
      return res.status(404).json({ message: "Reserva não encontrada." });
    }

    return res.json(reserva);
  } catch (error) {
    console.error("❌ Erro ao obter reserva:", error);
    return res.status(500).json({ message: "Erro ao buscar reserva." });
  }
};

// =============================================================
// 🔹 PATCH /reservas/:id/cancelar  → cancelar reserva
// =============================================================
export const cancelarReserva = async (req: Request, res: Response) => {
  try {
    const usuarioId = (req as any).user?.id;
    const { id } = req.params;

    if (!usuarioId) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const reserva = await Reserva.findById(id);

    if (!reserva) {
      return res.status(404).json({ message: "Reserva não encontrada." });
    }

    if (String(reserva.usuario) !== usuarioId) {
      return res.status(403).json({ message: "Você não pode cancelar esta reserva." });
    }

    if (reserva.status === "cancelado") {
      return res.status(400).json({ message: "Esta reserva já está cancelada." });
    }

    reserva.status = "cancelado";
    reserva.canceladoEm = new Date();
    await reserva.save();

    console.log("❌ Reserva cancelada:", reserva._id);

    return res.json({
      message: "Reserva cancelada com sucesso!",
      reserva,
    });
  } catch (error) {
    console.error("❌ Erro ao cancelar reserva:", error);
    return res.status(500).json({ message: "Erro ao cancelar reserva." });
  }
};
