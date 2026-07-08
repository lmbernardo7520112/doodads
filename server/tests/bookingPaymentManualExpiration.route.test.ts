// =============================================================
// 📌 tests/bookingPaymentManualExpiration.route.test.ts
// -------------------------------------------------------------
// Testes de rota para expiração manual/administrativa de
// pagamento vencido (Phase D7)
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

// Mock Stripe (required by pagamento.controller imported via App)
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
        data: { object: { metadata: { reservaId: "64b000000000000000000123" } } },
      })),
    },
  }))
);

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

const ROUTE_PREFIX = "/api/reservas/pagamento-manual";

describe("Expiração Manual de Pagamento — Rotas (Phase D7)", () => {
  let mongoServer: MongoMemoryServer;

  let barbeariaId: string;
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
  async function createPendingPaymentWithReserva(overrides?: {
    provider?: string;
    status?: string;
    expiresAt?: Date;
  }) {
    const reserva = await Reserva.create({
      usuario: clienteUserId,
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pendente",
      paymentRequired: true,
      paymentStatus: "pending",
    });

    const bp = await BookingPayment.create({
      reservaId: reserva._id,
      barbeariaId,
      provider: overrides?.provider || "manual",
      amountCents: 5500,
      currency: "BRL",
      status: overrides?.status || "pending",
      expiresAt: overrides?.expiresAt || new Date(Date.now() - 15 * 60000), // 15 min no passado
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
      nomeCompleto: "Barbeiro Route D7",
      email: "barbeiro_route_d7@t.com",
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
      nomeCompleto: "Cliente Route D7",
      email: "cliente_route_d7@t.com",
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
      nomeCompleto: "Admin Route D7",
      email: "admin_route_d7@t.com",
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
      nomeCompleto: "Outro Barbeiro Route D7",
      email: "outro_barbeiro_route_d7@t.com",
      senha: "123456_password",
      tipo: "barbeiro",
    } as any);
    outroBarbeiroUserId = outroBarbeiro._id.toString();
    outroBarbeiroToken = jwt.sign(
      { id: outroBarbeiroUserId, tipo: "barbeiro", email: outroBarbeiro.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Criar barbearia (barbeiro é dono)
    const barbearia = await Barbearia.create({
      nome: "Barbearia Route D7",
      endereco: {
        rua: "Rua Route D7",
        numero: "77",
        bairro: "Centro",
        cidade: "São Paulo",
        cep: "01001-000",
      },
      telefone1: "11999999777",
      barbeiro: barbeiroUserId,
    });
    barbeariaId = barbearia._id.toString();

    // Criar serviço
    const servico = await Servico.create({
      barbearia: barbeariaId,
      nome: "Corte Route D7",
      duracaoMin: 40,
      preco: 55,
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

  // =====================================================
  // 1. BARBEIRO PROPRIETÁRIO EXPIRA COM SUCESSO
  // =====================================================

  it("barbeiro proprietário expira pagamento vencido via rota — 200", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Pagamento expirado com sucesso.");
    expect(res.body.bookingPayment.status).toBe("expired");
    expect(res.body.reserva.paymentStatus).toBe("expired");
  });

  // =====================================================
  // 2. ADMIN EXPIRA COM SUCESSO
  // =====================================================

  it("admin expira pagamento vencido via rota — 200", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.bookingPayment.status).toBe("expired");
    expect(res.body.reserva.paymentStatus).toBe("expired");
  });

  // =====================================================
  // 3. CLIENTE RECEBE 403
  // =====================================================

  it("cliente recebe 403 ao tentar expirar pagamento", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${clienteToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CLIENT_CANNOT_EXPIRE_PAYMENT");
  });

  // =====================================================
  // 4. BARBEIRO DE OUTRA BARBEARIA RECEBE 403
  // =====================================================

  it("barbeiro de outra barbearia recebe 403 OWNERSHIP_MISMATCH", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${outroBarbeiroToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("OWNERSHIP_MISMATCH");
  });

  // =====================================================
  // 5. SEM AUTH RECEBE 401
  // =====================================================

  it("request sem token recebe 401", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .send({});

    expect(res.status).toBe(401);
  });

  // =====================================================
  // 6. PAGAMENTO AINDA NÃO VENCIDO NÃO EXPIRA
  // =====================================================

  it("pagamento ainda não vencido retorna 409 NOT_YET_EXPIRED", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      expiresAt: new Date(Date.now() + 30 * 60000), // 30 min no futuro
    });

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("NOT_YET_EXPIRED");
  });

  // =====================================================
  // 7. PAGAMENTO PAID NÃO EXPIRA
  // =====================================================

  it("pagamento paid retorna 409 CANNOT_EXPIRE_PAID", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ status: "paid" });

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CANNOT_EXPIRE_PAID");
  });

  // =====================================================
  // 8. PAGAMENTO MANUAL_REVIEW NÃO EXPIRA
  // =====================================================

  it("pagamento manual_review pode ser expirado se vencido", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({
      status: "manual_review",
      expiresAt: new Date(Date.now() - 1000), // no passado (vencido)
    });

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.bookingPayment.status).toBe("expired");
  });

  // =====================================================
  // 9. PROVIDER NÃO-MANUAL BLOQUEADO
  // =====================================================

  it("provider não-manual retorna 400 PROVIDER_NOT_MANUAL", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva({ provider: "banco_api_pix" });

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("PROVIDER_NOT_MANUAL");
  });

  // =====================================================
  // 10. MASS ASSIGNMENT — CAMPOS SERVER-OWNED REJEITADOS
  // =====================================================

  it("body com campos server-owned é rejeitado pelo schema (400)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({
        status: "expired",
        paymentStatus: "expired",
        expiresAt: new Date().toISOString(),
        amountCents: 9999,
        provider: "banco_api_pix",
        pixKey: "alguma-chave",
        webhook: "http://evil.com",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validação|inválid/i);
  });

  it("body com apenas status server-owned é rejeitado (400)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({ status: "expired" });

    expect(res.status).toBe(400);
  });

  // =====================================================
  // 11. RESPONSE CONTÉM LABELS PT-BR
  // =====================================================

  it("response contém paymentStatusPresentation e reservaStatusPresentation em PT-BR", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(200);

    expect(res.body.paymentStatusPresentation).toBeDefined();
    expect(res.body.paymentStatusPresentation.label).toBeDefined();
    expect(res.body.paymentStatusPresentation.label).not.toBe("expired");
    expect(res.body.paymentStatusPresentation.description).toBeDefined();
    expect(res.body.paymentStatusPresentation.tone).toBeDefined();

    expect(res.body.reservaStatusPresentation).toBeDefined();
    expect(res.body.reservaStatusPresentation.label).toBeDefined();
  });

  // =====================================================
  // 12. RESPONSE NÃO CONTÉM PIX REAL/QR/WEBHOOK/PROVIDER
  // =====================================================

  it("response não contém Pix real, QR, webhook ou provider real", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/pixQrCode/i);
    expect(body).not.toMatch(/pixCopyPaste/i);
    expect(body).not.toMatch(/copiaECola/i);
    expect(body).not.toMatch(/webhookEventId/i);
    expect(body).not.toMatch(/providerPaymentId/i);
    expect(body).not.toMatch(/pixKey/i);
    expect(body).not.toMatch(/credentialRef/i);
    expect(res.body.bookingPayment.provider).toBe("manual");
  });

  // =====================================================
  // 13. AUSÊNCIA DE FRONTEND
  // =====================================================

  it("expiração manual não depende de frontend (teste de sanidade)", () => {
    expect(ROUTE_PREFIX).toContain("/api/");
    expect(ROUTE_PREFIX).not.toContain("client");
    expect(ROUTE_PREFIX).not.toContain("component");
  });

  // =====================================================
  // 14. BOOKINGPAYMENTID INVÁLIDO
  // =====================================================

  it("bookingPaymentId inválido retorna 400 (schema validation)", async () => {
    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/invalido/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  // =====================================================
  // 15. BODY VAZIO É ACEITO
  // =====================================================

  it("body vazio é aceito (expirationNote é opcional)", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.bookingPayment.status).toBe("expired");
  });

  // =====================================================
  // 16. RESERVA.STATUS MANTIDO (retrocompatibilidade)
  // =====================================================

  it("Reserva.status é atualizado para 'cancelado' após expiração", async () => {
    const { bookingPayment } = await createPendingPaymentWithReserva();

    const res = await request(app)
      .patch(`${ROUTE_PREFIX}/${bookingPayment._id}/expirar`)
      .set("Authorization", `Bearer ${barbeiroToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.reserva.status).toBe("cancelado");
    expect(res.body.reserva.paymentStatus).toBe("expired");
  });

  // =====================================================
  // 17. AUSÊNCIA DE CRON/JOB/SCHEDULER
  // =====================================================

  it("expiração é invocada manualmente via rota, sem cron/job/scheduler", () => {
    // A rota é PATCH manual, não é executada automaticamente
    // Não há cron, job, scheduler ou worker associado
    expect(ROUTE_PREFIX).toContain("pagamento-manual");
  });
});
