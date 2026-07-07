// =============================================================
// 📌 tests/bookingPaymentManualList.route.test.ts
// -------------------------------------------------------------
// Testes de rota para listagem de pagamentos manuais (Phase E2)
// =============================================================

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

import app from "../App";
import User from "../models/User";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import Reserva from "../models/Reserva";
import BookingPayment from "../models/BookingPayment";

// Mock Stripe
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
      })),
    },
  }))
);

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

describe("Listagem de Pagamentos Manuais — Rotas (Phase E2)", () => {
  let mongoServer: MongoMemoryServer;

  let barbeariaId: string;
  let outraBarbeariaId: string;
  let servicoId: string;
  let barbeiroUserId: string;
  let clienteUserId: string;
  let adminUserId: string;
  let outroBarbeiroUserId: string;

  let barbeiroToken: string;
  let clienteToken: string;
  let adminToken: string;
  let outroBarbeiroToken: string;

  // Helper: cria BookingPayment + Reserva associada
  async function createPendingPaymentWithReserva(bId: string, overrides?: {
    status?: string;
    expiresAt?: Date;
  }) {
    const reserva = await Reserva.create({
      usuario: clienteUserId,
      barbearia: bId,
      servico: servicoId,
      dataHora: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pendente",
      paymentRequired: true,
      paymentStatus: overrides?.status || "pending",
    });

    const bp = await BookingPayment.create({
      reservaId: reserva._id,
      barbeariaId: bId,
      provider: "manual",
      amountCents: 4500,
      currency: "BRL",
      status: overrides?.status || "pending",
      expiresAt: overrides?.expiresAt || new Date(Date.now() + 30 * 60000),
      idempotencyKey: `idemp-${reserva._id}`,
    });

    reserva.bookingPaymentId = bp._id as any;
    await reserva.save();

    return { reserva, bookingPayment: bp };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Criar usuários
    const barbeiro = await User.create({
      nomeCompleto: "Barbeiro Owner",
      email: "barbeiro_owner@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    barbeiroUserId = barbeiro._id.toString();
    barbeiroToken = jwt.sign(
      { id: barbeiroUserId, tipo: "barbeiro", email: barbeiro.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const cliente = await User.create({
      nomeCompleto: "Cliente Teste",
      email: "cliente_teste@t.com",
      senha: "123456_password",
      tipo: "cliente",
    } as any);
    clienteUserId = cliente._id.toString();
    clienteToken = jwt.sign(
      { id: clienteUserId, tipo: "cliente", email: cliente.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const admin = await User.create({
      nomeCompleto: "Admin Teste",
      email: "admin_teste@t.com",
      senha: "123456_password",
      tipo: "admin",
    } as any);
    adminUserId = admin._id.toString();
    adminToken = jwt.sign(
      { id: adminUserId, tipo: "admin", email: admin.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const outroBarbeiro = await User.create({
      nomeCompleto: "Outro Barbeiro",
      email: "outro_barbeiro@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    outroBarbeiroUserId = outroBarbeiro._id.toString();
    outroBarbeiroToken = jwt.sign(
      { id: outroBarbeiroUserId, tipo: "barbeiro", email: outroBarbeiro.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Barbearias
    const barbearia = await Barbearia.create({
      nome: "Barbearia do Barbeiro",
      endereco: { rua: "Rua A", numero: "10", bairro: "Centro", cidade: "São Paulo", cep: "01001-000" },
      telefone1: "11999999555",
      barbeiro: barbeiroUserId,
    });
    barbeariaId = barbearia._id.toString();

    const outraBarb = await Barbearia.create({
      nome: "Outra Barbearia",
      endereco: { rua: "Rua B", numero: "20", bairro: "Centro", cidade: "São Paulo", cep: "01001-000" },
      telefone1: "11999999556",
      barbeiro: outroBarbeiroUserId,
    });
    outraBarbeariaId = outraBarb._id.toString();

    // Serviço
    const servico = await Servico.create({
      barbearia: barbeariaId,
      nome: "Corte Simples",
      duracaoMin: 30,
      preco: 45.0,
      ativo: true,
    });
    servicoId = servico._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await BookingPayment.deleteMany({});
    await Reserva.deleteMany({});
  });

  it("barbeiro proprietário lista pagamentos com sucesso — 200", async () => {
    await createPendingPaymentWithReserva(barbeariaId);
    await createPendingPaymentWithReserva(barbeariaId, { status: "paid" });

    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais`)
      .set("Authorization", `Bearer ${barbeiroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);

    const payment = res.body.data[0];
    expect(payment.bookingPaymentId).toBeDefined();
    expect(payment.reservaId).toBeDefined();
    expect(payment.barbeariaId).toBe(barbeariaId);
    expect(payment.amountCents).toBe(4500);
    expect(payment.currency).toBe("BRL");
    expect(payment.paymentStatus).toBeDefined();
    expect(payment.paymentStatusPresentation).toBeDefined();
    expect(payment.reservaStatusPresentation).toBeDefined();
    expect(payment.reserva).toBeDefined();
    expect(payment.reserva.servico.nome).toBe("Corte Simples");
    expect(payment.reserva.usuario.nomeCompleto).toBe("Cliente Teste");

    // Garantir que campos proibidos não estão no body
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain("pixKey");
    expect(bodyStr).not.toContain("idempotencyKey");
    expect(bodyStr).not.toContain("metadataSafe");
  });

  it("cliente recebe 403 Forbidden ao tentar listar", async () => {
    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais`)
      .set("Authorization", `Bearer ${clienteToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Clientes não podem listar pagamentos da barbearia.");
  });

  it("barbeiro de outra barbearia recebe 403 Forbidden", async () => {
    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais`)
      .set("Authorization", `Bearer ${outroBarbeiroToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Você não tem permissão para listar pagamentos desta barbearia.");
  });

  it("admin pode listar qualquer barbearia — 200", async () => {
    await createPendingPaymentWithReserva(barbeariaId);

    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it("request sem token recebe 401 Unauthorized", async () => {
    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais`);

    expect(res.status).toBe(401);
  });

  it("filtros de status funcionam corretamente", async () => {
    await createPendingPaymentWithReserva(barbeariaId, { status: "pending" });
    await createPendingPaymentWithReserva(barbeariaId, { status: "paid" });

    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais?status=paid`)
      .set("Authorization", `Bearer ${barbeiroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].paymentStatus).toBe("paid");
  });

  it("filtro de status inválido retorna 400 Bad Request", async () => {
    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais?status=invalid_status`)
      .set("Authorization", `Bearer ${barbeiroToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Erro de validação de dados.");
  });

  it("filtro overdueOnly=true retorna apenas pagamentos pendentes vencidos", async () => {
    // 1. Um pagamento pendente no futuro (não vencido)
    await createPendingPaymentWithReserva(barbeariaId, {
      status: "pending",
      expiresAt: new Date(Date.now() + 10 * 60000),
    });

    // 2. Um pagamento pendente no passado (vencido)
    await createPendingPaymentWithReserva(barbeariaId, {
      status: "pending",
      expiresAt: new Date(Date.now() - 5 * 60000),
    });

    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais?overdueOnly=true`)
      .set("Authorization", `Bearer ${barbeiroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].canExpire).toBe(true);
    expect(res.body.data[0].canConfirm).toBe(false);
  });

  it("campos adicionais não especificados na query são rejeitados (Zod strict)", async () => {
    const res = await request(app)
      .get(`/api/barbearias/${barbeariaId}/pagamentos-manuais?hackField=true`)
      .set("Authorization", `Bearer ${barbeiroToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Erro de validação de dados.");
  });
});
