import { Request, Response } from "express";
import Servico from "../models/Servico";

export const listarServicosPorBarbearia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const servicos = await Servico.find({ barbearia: id, ativo: true });
    res.status(200).json(servicos);
  } catch (error) {
    console.error("Erro ao listar serviços:", error);
    res.status(500).json({ message: "Erro ao listar serviços." });
  }
};
