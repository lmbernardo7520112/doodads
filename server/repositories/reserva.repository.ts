import Reserva, { IReserva } from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import Servico, { IServico } from "../models/Servico";

export class ReservaRepository {
  async findById(id: string): Promise<IReserva | null> {
    return Reserva.findById(id).populate("barbearia", "nome imagem telefone1").populate("servico", "nome preco duracaoMin");
  }

  async findMinhas(usuarioId: string): Promise<IReserva[]> {
    return Reserva.find({ usuario: usuarioId })
      .populate("barbearia", "nome imagem telefone1")
      .populate("servico", "nome preco duracaoMin")
      .sort({ dataHora: -1 });
  }

  async findConflito(barbearia: string, data: Date, endDate: Date): Promise<IReserva | null> {
    // simplified conflict: checks if any reservation starts exactly at data, or if we want overlap we can check. 
    // To not break existing generateSlots which relies on exact slots, we just check if there's any active reservation that falls within [data, endDate).
    // But since existing reservations don't have endDate stored, we'll just check if any reservation's start time is within our new slot.
    return Reserva.findOne({
      barbearia,
      dataHora: { $gte: data, $lt: endDate },
      status: { $nin: ["cancelado", "finalizado"] },
    });
  }

  async checkBarbeariaExists(id: string): Promise<boolean> {
    const b = await Barbearia.findById(id);
    return !!b;
  }

  async checkServicoExists(id: string, barbeariaId: string): Promise<IServico | null> {
    return Servico.findOne({ _id: id, barbearia: barbeariaId });
  }

  async create(data: Partial<IReserva>): Promise<IReserva> {
    return Reserva.create(data);
  }

  async save(reserva: IReserva): Promise<IReserva> {
    return reserva.save();
  }
}
export const reservaRepository = new ReservaRepository();
