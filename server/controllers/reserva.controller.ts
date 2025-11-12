// =============================================================
// 📅 reserva.controller.ts
// -------------------------------------------------------------
// Controla CRUD de reservas (agendamentos)
// =============================================================

import { Request, Response } from "express";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";

export const listarReservas = async (_req: Request, res: Response) => {
  try {
    const reservas = await Reserva.find()
      .populate("barbearia", "nome endereco imagem")
      .populate("usuario", "nomeCompleto email")
      .sort({ dataHora: -1 });

    res.status(200).json(reservas);
  } catch (error) {
    console.error("Erro ao listar reservas:", error);
    res.status(500).json({ message: "Erro ao listar reservas." });
  }
};

export const criarReserva = async (req: Request, res: Response) => {
  try {
    const { usuario, barbearia, servico, dataHora, valor } = req.body;

    const barbeariaExiste = await Barbearia.findById(barbearia);
    if (!barbeariaExiste) {
      return res.status(404).json({ message: "Barbearia não encontrada." });
    }

    const reserva = await Reserva.create({
      usuario,
      barbearia,
      servico,
      dataHora,
      valor,
      status: "confirmado",
    });

    res.status(201).json({ message: "Reserva criada com sucesso!", reserva });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    res.status(500).json({ message: "Erro ao criar reserva." });
  }
};

export const obterReservaPorId = async (req: Request, res: Response) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
      .populate("barbearia", "nome endereco imagem")
      .populate("usuario", "nomeCompleto email");

    if (!reserva) {
      return res.status(404).json({ message: "Reserva não encontrada." });
    }

    res.json(reserva);
  } catch (error) {
    console.error("Erro ao obter reserva:", error);
    res.status(500).json({ message: "Erro ao buscar reserva." });
  }
};
