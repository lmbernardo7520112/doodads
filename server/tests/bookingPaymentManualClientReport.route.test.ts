import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../App";
import User from "../models/User";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import BookingPayment from "../models/BookingPayment";

const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";

describe("Client Report Manual Payment Sent — Route Test", () => {
  let mongoServer: MongoMemoryServer;

  let barbeariaId: string;
  let barbeiroUserId: string;
  let clienteUserId: string;
  let outroClienteUserId: string;

  let clienteToken: string;
  let outroClienteToken: string;

  async function createPendingPaymentWithReserva(usuarioId: string) {
    const reserva = await Reserva.create({
      usuario: usuarioId,
      barbearia: barbeariaId,
      servico: new mongoose.Types.ObjectId(),
      dataHora: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pendente",
      paymentRequired: true,
      paymentStatus: "pending",
    });

    const bp = await BookingPayment.create({
      reservaId: reserva._id,
      barbeariaId,
      provider: "manual",
      amountCents: 4500,
      currency: "BRL",
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    reserva.bookingPaymentId = bp._id as any;
    await reserva.save();

    return { reserva, bookingPayment: bp };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const barbeiro = await User.create({
      nomeCompleto: "Barbeiro Route",
      email: "barbeiro@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    barbeiroUserId = barbeiro._id.toString();

    const barbearia = await Barbearia.create({
      nome: "Barbearia Test",
      endereco: { rua: "Rua T", numero: "1", bairro: "B", cidade: "C", cep: "1" },
      telefone1: "1234",
      barbeiro: barbeiro._id,
      ativo: true,
    });
    barbeariaId = barbearia._id.toString();

    const cliente = await User.create({
      nomeCompleto: "Cliente Test",
      email: "cliente@t.com",
      senha: "123456_password",
      tipo: "cliente",
    } as any);
    clienteUserId = cliente._id.toString();
    clienteToken = jwt.sign({ id: clienteUserId, tipo: "cliente", email: cliente.email }, JWT_SECRET, { expiresIn: "1h" });

    const outroCliente = await User.create({
      nomeCompleto: "Outro Cliente Test",
      email: "outro_cliente@t.com",
      senha: "123456_password",
      tipo: "cliente",
    } as any);
    outroClienteUserId = outroCliente._id.toString();
    outroClienteToken = jwt.sign({ id: outroClienteUserId, tipo: "cliente", email: outroCliente.email }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("deve permitir ao cliente declarar pagamento enviado", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva(clienteUserId);

    const res = await request(app)
      .patch(`/api/reservas/pagamento-manual/${bookingPayment._id}/declarar-pago`)
      .set("Authorization", `Bearer ${clienteToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.bookingPayment.status).toBe("manual_review");
    expect(res.body.reserva.paymentStatus).toBe("manual_review");
    expect(res.body.message).toContain("Pagamento declarado com sucesso");
  });

  it("deve bloquear se não estiver autenticado", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva(clienteUserId);

    const res = await request(app)
      .patch(`/api/reservas/pagamento-manual/${bookingPayment._id}/declarar-pago`)
      .send();

    expect(res.status).toBe(401);
  });

  it("deve bloquear se o cliente não for o dono da reserva (403)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva(clienteUserId);

    const res = await request(app)
      .patch(`/api/reservas/pagamento-manual/${bookingPayment._id}/declarar-pago`)
      .set("Authorization", `Bearer ${outroClienteToken}`) // outro cliente
      .send();

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("OWNERSHIP_MISMATCH");
  });
});
