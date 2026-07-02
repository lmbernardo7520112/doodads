import Reserva, { IReserva } from "../models/Reserva";
import Barbearia from "../models/Barbearia";

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

  async findConflito(barbearia: string, servico: string, data: Date): Promise<IReserva | null> {
    return Reserva.findOne({
      barbearia,
      servico,
      dataHora: data,
      status: { $ne: "cancelado" },
    });
  }

  async checkBarbeariaExists(id: string): Promise<boolean> {
    const b = await Barbearia.findById(id);
    return !!b;
  }

  async create(data: Partial<IReserva>): Promise<IReserva> {
    return Reserva.create(data);
  }

  async save(reserva: IReserva): Promise<IReserva> {
    return reserva.save();
  }
}
export const reservaRepository = new ReservaRepository();
