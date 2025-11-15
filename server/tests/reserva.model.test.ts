import Reserva from "../models/Reserva";
import mongoose from "mongoose";

beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/doodads_test");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});


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
