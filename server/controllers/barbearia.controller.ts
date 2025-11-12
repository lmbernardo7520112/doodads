// =============================================================
// 💈 barbearia.controller.ts
// -------------------------------------------------------------
// Controla listagem e detalhes de barbearias
// =============================================================

import { Request, Response } from "express";
import Barbearia from "../models/Barbearia";

// ✅ Listar todas as barbearias
export const listarBarbearias = async (_req: Request, res: Response) => {
  try {
    const barbearias = await Barbearia.find();
    res.status(200).json(barbearias);
  } catch (error) {
    console.error("Erro ao listar barbearias:", error);
    res.status(500).json({ message: "Erro ao listar barbearias." });
  }
};

// ✅ Obter uma barbearia por ID
export const obterBarbeariaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const barbearia = await Barbearia.findById(id);

    if (!barbearia) {
      return res.status(404).json({ message: "Barbearia não encontrada." });
    }

    res.status(200).json(barbearia);
  } catch (error) {
    console.error("Erro ao buscar barbearia:", error);
    res.status(500).json({ message: "Erro ao buscar barbearia." });
  }
};
