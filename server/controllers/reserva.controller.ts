// =============================================================
// 📅 server/controllers/reserva.controller.ts
// -------------------------------------------------------------
// CRUD + pagamento simulado (desenvolvimento)
// =============================================================

// =============================================================
// 📅 server/controllers/reserva.controller.ts
// -------------------------------------------------------------
// CRUD + pagamento simulado (desenvolvimento)
// =============================================================

import { Request, Response } from "express";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";

// Utilidades internas
const getUserInfo = (req: Request) => {
  const user = (req as any).user || {};
  return { id: user.id, tipo: user.tipo };
};

// =============================================================
// NEW: GET /reservas/:id
// =============================================================
export const getReservaById = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || "no-reqid";
  const start = Date.now();

  try {
    const { id: usuarioId } = getUserInfo(req);
    const { id } = req.params;

    console.log(`🔎 [getReservaById] id=${requestId} reserva=${id} usuario=${usuarioId}`);

    if (!usuarioId) {
      console.log(`⛔ [getReservaById] id=${requestId} usuário não autenticado`);
      return res.status(401).json({ message: "Não autorizado." });
    }

    const reserva = await Reserva.findById(id)
      .populate("barbearia", "nome imagem telefone1")
      .populate("servico", "nome preco duracaoMin");

    if (!reserva) {
      console.log(`⚠️ [getReservaById] id=${requestId} reserva não encontrada`);
      return res.status(404).json({ message: "Reserva não encontrada." });
    }

    if (String(reserva.usuario) !== String(usuarioId)) {
      console.log(`⛔ [getReservaById] id=${requestId} tentativa de acesso indevido`);
      return res.status(403).json({ message: "Acesso negado à reserva." });
    }

    console.log(
      `📦 [getReservaById] id=${requestId} OK duration=${Date.now() - start}ms`
    );
    return res.status(200).json(reserva);
  } catch (error) {
    console.error(`❌ [getReservaById] id=${requestId} erro:`, error);
    return res.status(500).json({ message: "Erro ao buscar reserva." });
  }
};

// =============================================================
// GET /reservas/minhas
// =============================================================
export const listarMinhasReservas = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || "no-reqid";
  const start = Date.now();

  try {
    const { id: usuarioId } = getUserInfo(req);

    console.log(
      `🔎 [listarMinhasReservas] id=${requestId} usuarioId=${usuarioId}`
    );

    if (!usuarioId) {
      console.log(
        `⛔ [listarMinhasReservas] id=${requestId} SEM usuarioId (Authorization ausente)`
      );
      return res.status(401).json({ message: "Não autorizado." });
    }

    const reservas = await Reserva.find({ usuario: usuarioId })
      .populate("barbearia", "nome imagem telefone1")
      .populate("servico", "nome preco duracaoMin")
      .sort({ dataHora: -1 });

    console.log(
      `📦 [listarMinhasReservas] id=${requestId} returning=${reservas.length} duration=${Date.now() - start}ms`
    );

    return res.status(200).json(reservas);
  } catch (error) {
    console.error(
      `❌ [listarMinhasReservas] id=${requestId} erro:`,
      error
    );
    return res
      .status(500)
      .json({ message: "Erro ao listar reservas do usuário." });
  }
};

// =============================================================
// POST /reservas → CRIAR
// =============================================================
export const criarReserva = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || "no-reqid";
  const start = Date.now();

  try {
    const { id: usuarioId } = getUserInfo(req);
    if (!usuarioId) {
      console.log(`⛔ [criarReserva] id=${requestId} SEM usuarioId`);
      return res.status(401).json({ message: "Não autorizado." });
    }

    const { barbearia, servico, dataHora, valor } = req.body;

    console.log(
      `📝 [criarReserva] id=${requestId} usuario=${usuarioId} barbearia=${barbearia} servico=${servico}`
    );

    if (!barbearia || !servico || !dataHora)
      return res.status(400).json({
        message: "Dados incompletos para criar reserva.",
      });

    const barbeariaExiste = await Barbearia.findById(barbearia);
    if (!barbeariaExiste)
      return res
        .status(404)
        .json({ message: "Barbearia não encontrada." });

    const data = new Date(dataHora);
    if (isNaN(data.getTime()))
      return res.status(400).json({ message: "Data inválida." });

    const conflito = await Reserva.findOne({
      barbearia,
      servico,
      dataHora: data,
      status: { $ne: "cancelado" },
    });

    if (conflito)
      return res.status(409).json({
        message: "Horário já reservado.",
      });

    const reserva = await Reserva.create({
      usuario: usuarioId,
      barbearia,
      servico,
      dataHora: data,
      valor,
      status: "pendente",
      paymentStatus: "pendente",
    });

    console.log(
      `🎉 [criarReserva] id=${requestId} criada reserva=${reserva._id} duration=${Date.now() - start}ms`
    );

    return res
      .status(201)
      .json({ message: "Reserva criada com sucesso!", reserva });
  } catch (error) {
    console.error(`❌ [criarReserva] id=${requestId} erro:`, error);
    return res.status(500).json({ message: "Erro ao criar reserva." });
  }
};

// =============================================================
// PATCH /reservas/:id/cancelar
// =============================================================
export const cancelarReserva = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || "no-reqid";

  try {
    const { id: usuarioId, tipo: usuarioTipo } = getUserInfo(req);
    const { id } = req.params;

    console.log(
      `🗑️ [cancelarReserva] id=${requestId} reserva=${id} usuario=${usuarioId} tipo=${usuarioTipo}`
    );

    const body = req.body || {};
    const reason = body.reason || "";

    if (!usuarioId)
      return res.status(401).json({ message: "Não autorizado." });

    const reserva = await Reserva.findById(id);
    if (!reserva)
      return res
        .status(404)
        .json({ message: "Reserva não encontrado." });

    const isOwner = String(reserva.usuario) === String(usuarioId);
    const isPrivileged = ["barbeiro", "admin", "staff"].includes(usuarioTipo);

    if (!isOwner && !isPrivileged)
      return res
        .status(403)
        .json({ message: "Você não pode cancelar esta reserva." });

    if (reserva.status === "cancelado")
      return res
        .status(400)
        .json({ message: "Esta reserva já está cancelada." });

    const cutoffMinutes = Number(process.env.CANCEL_CUTOFF_MINUTES || "60");
    const now = new Date();
    const diffMinutes =
      (new Date(reserva.dataHora).getTime() -
        now.getTime()) /
      60000;

    if (diffMinutes < cutoffMinutes && !isPrivileged) {
      return res.status(400).json({
        message: `Cancelamento não permitido: só é possível cancelar até ${cutoffMinutes} minutos antes do horário.`,
      });
    }

    reserva.status = "cancelado";
    reserva.canceladoEm = new Date();
    if (reason.trim().length > 0) reserva.cancelReason = reason.trim();

    await reserva.save();

    console.log(
      `🗑️ [cancelarReserva] id=${requestId} cancelada reserva=${id}`
    );

    return res.json({
      message: "Reserva cancelada com sucesso!",
      reserva,
    });
  } catch (error) {
    console.error(`❌ [cancelarReserva] id=${requestId} erro:`, error);
    return res.status(500).json({ message: "Erro ao cancelar reserva." });
  }
};

// =============================================================
// PATCH /reservas/:id/pagar → SIMULADO
// =============================================================
export const pagarReservaSimulado = async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || "no-reqid";

  try {
    const { id: usuarioId } = getUserInfo(req);
    const { id } = req.params;

    console.log(
      `💳 [pagarReservaSimulado] id=${requestId} reserva=${id} usuario=${usuarioId}`
    );

    const reserva = await Reserva.findById(id);

    if (!reserva)
      return res
        .status(404)
        .json({ message: "Reserva não encontrada." });

    if (String(reserva.usuario) !== String(usuarioId))
      return res
        .status(403)
        .json({ message: "Você não pode pagar por esta reserva." });

    if (reserva.status === "cancelado")
      return res
        .status(400)
        .json({ message: "Reserva já cancelada." });

    if (reserva.paymentStatus === "aprovado")
      return res
        .status(400)
        .json({ message: "Pagamento já aprovado." });

    reserva.paymentStatus = "aprovado";
    reserva.status = "confirmado";
    reserva.confirmadoEm = new Date();
    reserva.paymentId = "simulated-payment-" + reserva._id;

    await reserva.save();

    console.log(
      `🎉 [pagarReservaSimulado] id=${requestId} pagamento confirmado reserva=${id}`
    );

    return res.json({
      message: "Pagamento simulado aprovado!",
      reserva,
    });
  } catch (error) {
    console.error(`❌ [pagarReservaSimulado] id=${requestId} erro:`, error);
    return res.status(500).json({ message: "Erro ao simular pagamento." });
  }
};
