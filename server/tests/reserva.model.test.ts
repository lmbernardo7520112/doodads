import Reserva from "../models/Reserva";
import mongoose from "mongoose";

describe("Reserva Model — PRD-004", () => {
  it("deve criar uma reserva com status 'pendente' por padrão", async () => {
    const reserva = await Reserva.create({
      usuario: new mongoose.Types.ObjectId(),
      barbearia: new mongoose.Types.ObjectId(),
      servico: new mongoose.Types.ObjectId(),
      dataHora: new Date(),
      valor: 90,
    });

    expect(reserva.status).toBe("pendente");
  });
});
