import { Request, Response } from "express";
import { reservaService } from "../services/reserva.service";

const getUserInfo = (req: Request) => {
  const user = (req as any).user || {};
  return { id: user.id, tipo: user.tipo };
};

const mapError = (res: Response, error: any, defaultMsg: string) => {
  const msg = error.message;
  if (msg === "NOT_FOUND") return res.status(404).json({ message: "Reserva não encontrada." });
  if (msg === "NOT_FOUND_CANCEL") return res.status(404).json({ message: "Reserva não encontrado." });
  if (msg === "BARBEARIA_NOT_FOUND") return res.status(404).json({ message: "Barbearia não encontrada." });
  if (msg === "FORBIDDEN") return res.status(403).json({ message: "Acesso negado à reserva." });
  if (msg === "FORBIDDEN_CANCEL") return res.status(403).json({ message: "Você não pode cancelar esta reserva." });
  if (msg === "FORBIDDEN_PAY") return res.status(403).json({ message: "Você não pode pagar por esta reserva." });
  if (msg === "INVALID_DATE") return res.status(400).json({ message: "Data inválida." });
  if (msg === "CONFLICT") return res.status(409).json({ message: "Horário já reservado." });
  if (msg === "ALREADY_CANCELLED") return res.status(400).json({ message: "Esta reserva já está cancelada." });
  if (msg === "ALREADY_PAID") return res.status(400).json({ message: "Pagamento já aprovado." });
  if (msg === "TOO_LATE") {
    const cutoffMinutes = Number(process.env.CANCEL_CUTOFF_MINUTES || "60");
    return res.status(400).json({ message: `Cancelamento não permitido: só é possível cancelar até ${cutoffMinutes} minutos antes do horário.` });
  }

  console.error(error);
  return res.status(500).json({ message: defaultMsg });
};

export const getReservaById = async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = getUserInfo(req);
    if (!usuarioId) return res.status(401).json({ message: "Não autorizado." });
    
    const reserva = await reservaService.getReservaById(req.params.id, usuarioId);
    return res.status(200).json(reserva);
  } catch (error) {
    return mapError(res, error, "Erro ao buscar reserva.");
  }
};

export const listarMinhasReservas = async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = getUserInfo(req);
    if (!usuarioId) return res.status(401).json({ message: "Não autorizado." });
    
    const reservas = await reservaService.listarMinhasReservas(usuarioId);
    return res.status(200).json(reservas);
  } catch (error) {
    return mapError(res, error, "Erro ao listar reservas do usuário.");
  }
};

export const criarReserva = async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = getUserInfo(req);
    if (!usuarioId) return res.status(401).json({ message: "Não autorizado." });
    
    const { barbearia, servico, dataHora, valor } = req.body;
    if (!barbearia || !servico || !dataHora) return res.status(400).json({ message: "Dados incompletos para criar reserva." });

    const reserva = await reservaService.criarReserva(usuarioId, barbearia, servico, dataHora, valor);
    return res.status(201).json({ message: "Reserva criada com sucesso!", reserva });
  } catch (error) {
    return mapError(res, error, "Erro ao criar reserva.");
  }
};

export const cancelarReserva = async (req: Request, res: Response) => {
  try {
    const { id: usuarioId, tipo: usuarioTipo } = getUserInfo(req);
    if (!usuarioId) return res.status(401).json({ message: "Não autorizado." });

    const reason = req.body?.reason || "";
    const reserva = await reservaService.cancelarReserva(req.params.id, usuarioId, usuarioTipo, reason);
    return res.json({ message: "Reserva cancelada com sucesso!", reserva });
  } catch (error) {
    return mapError(res, error, "Erro ao cancelar reserva.");
  }
};

export const pagarReservaSimulado = async (req: Request, res: Response) => {
  try {
    const { id: usuarioId } = getUserInfo(req);
    if (!usuarioId) return res.status(401).json({ message: "Não autorizado." });

    const reserva = await reservaService.pagarReservaSimulado(req.params.id, usuarioId);
    return res.json({ message: "Pagamento simulado aprovado!", reserva });
  } catch (error) {
    return mapError(res, error, "Erro ao simular pagamento.");
  }
};
