// =============================================================
// 📌 tests/reserva.routes.full.test.ts — PRD-004 + PRD-006
// -------------------------------------------------------------
// Testes completos de rotas de reserva e pagamento integrado
// =============================================================

// =============================================================
// tests/reserva.routes.full.test.ts — CORRIGIDO
// =============================================================
import request from "supertest";
import mongoose from "mongoose";
import app from "../App";

import User from "../models/User";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import Reserva from "../models/Reserva";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// MOCK STRIPE
jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: "sess_123",
          url: "https://stripe.test/checkout",
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation(() => ({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: {
              reservaId: "64b000000000000000000123",
            },
          },
        },
      })),
    },
  }))
);

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

let token: string;
let userId: string;
let barbeariaId: string;
let servicoId: string;

beforeAll(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/test_full_reservas");

  const user = await User.create({
    nomeCompleto: "Cliente Teste",
    email: "cli@test.com",
    senha: "123456",
    tipo: "cliente",
  });

  userId = user._id.toString();

  token = jwt.sign(
    { id: userId, tipo: "cliente", email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const b = await Barbearia.create({
    nome: "Barbearia XPTO",
    telefone1: "11999999999",
    endereco: {
      rua: "Rua A",
      numero: "10",
      bairro: "Centro",
      cidade: "Cidade Y",
      cep: "00000-000",
    },
  });

  barbeariaId = b._id.toString();

  const s = await Servico.create({
    nome: "Corte",
    preco: 40,
    duracaoMin: 30,
    barbearia: barbeariaId,
  });

  servicoId = s._id.toString();
});

afterEach(async () => {
  await Reserva.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// =============================================================
// PRD-004 — Criação
// =============================================================
describe("Reserva — PRD-004", () => {
  it("cria reserva pendente", async () => {
    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: barbeariaId,
        servico: servicoId,
        dataHora: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.reserva.status).toBe("pendente");
  });

  it("impede reserva com horário já reservado", async () => {
    const data = new Date().toISOString();

    await Reserva.create({
      usuario: userId,
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: data,
      status: "confirmado",
    });

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: barbeariaId,
        servico: servicoId,
        dataHora: data,
      });

    expect(res.status).toBe(409);
  });
});

// =============================================================
// PRD-005 — Cancelamento
// =============================================================
describe("Reserva — cancelamento PRD-005", () => {
  it("não permite cancelar reserva a menos de 1h", async () => {
    const daqui30 = new Date(Date.now() + 30 * 60000);

    const r = await Reserva.create({
      usuario: userId,
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: daqui30,
      status: "pendente",
    });

    const res = await request(app)
      .patch(`/api/reservas/${r._id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);

    // Aceita múltiplas mensagens
    expect(res.body.message).toMatch(/(60 minutos|1 hora|menos de)/i);
  });

  it("cancela quando faltam mais de 1h", async () => {
    const depois2h = new Date(Date.now() + 2 * 3600000);

    const r = await Reserva.create({
      usuario: userId,
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: depois2h,
      status: "pendente",
    });

    const res = await request(app)
      .patch(`/api/reservas/${r._id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.reserva.status).toBe("cancelado");
  });
});

// =============================================================
// PRD-006 — Pagamento (Stripe)
// =============================================================
describe("Pagamento — PRD-006", () => {
  it("gera checkout", async () => {
    const r = await Reserva.create({
      usuario: userId,
      barbearia: barbeariaId,
      servico: servicoId,
      valor: 40,
      dataHora: new Date(Date.now() + 2 * 3600000),
      status: "pendente",
    });

    const res = await request(app)
      .post("/api/pagamento/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservaId: r._id });

    expect(res.status).toBe(200);
    expect(res.body.url).toContain("stripe");
  });

  it("webhook aprova pagamento", async () => {
    const id = new mongoose.Types.ObjectId("64b000000000000000000123");

    await Reserva.create({
      _id: id,
      usuario: userId,
      barbearia: barbeariaId,
      servico: servicoId,
      valor: 40,
      dataHora: new Date(Date.now() + 2 * 3600000),
      status: "pendente",
      paymentStatus: "pendente",
    });

    const res = await request(app)
      .post("/api/pagamento/webhook")
      .set("stripe-signature", "fake")
      .send({}); // corpo mockado (RAW será convertido automaticamente)

    expect(res.status).toBe(200);

    const updated = await Reserva.findById(id);
    expect(updated?.status).toBe("confirmado");
    expect(updated?.paymentStatus).toBe("aprovado");
  });

  it("não permite pagamento duplicado", async () => {
    const r = await Reserva.create({
      usuario: userId,
      barbearia: barbeariaId,
      servico: servicoId,
      valor: 40,
      dataHora: new Date(Date.now() + 2 * 3600000),
      status: "confirmado",
      paymentStatus: "aprovado",
    });

    const res = await request(app)
      .post("/api/pagamento/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservaId: r._id });

    expect(res.status).toBe(400);
  });
});
