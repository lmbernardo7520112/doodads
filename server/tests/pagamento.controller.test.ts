/**
 * pagamento.controller.test.ts — Versão FINAL funcionando
 */

import request from "supertest";
import app from "../App";
import Reserva from "../models/Reserva";
import jwt from "jsonwebtoken";

// =====================================================================
// TOKEN VÁLIDO (passa pelo middleware sem erro)
// =====================================================================
const tokenValido = `Bearer ${jwt.sign(
  { id: "user01", tipo: "cliente" },
  process.env.JWT_SECRET || "defaultsecret"
)}`;

// =====================================================================
// MOCK REAL DO STRIPE — mesmo objeto USADO PELO controller
// =====================================================================
jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => {
    return {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: "sess_123",
            url: "https://stripe.com/test",
          }),
        },
      },
      webhooks: {
        constructEvent: jest.fn().mockImplementation(() => ({
          type: "checkout.session.completed",
          data: {
            object: {
              id: "sess_123",
              metadata: { reservaId: "64b000000000000000000123" },
            },
          },
        })),
      },
    };
  })
);

// =====================================================================
// MOCK chainable do Mongoose (FUNCIONA no populate().populate())
// =====================================================================
function mockFindById(result: any) {
  return {
    populate: jest.fn().mockReturnThis(),
    then: undefined, // impede comportamento de Promise acidental
    // O controller espera que após populate... o objeto final seja "result"
    exec: jest.fn().mockResolvedValue(result),
    // devolve objeto final em await direto
    ...result,
  };
}

describe("Pagamento Controller", () => {
  afterEach(() => jest.restoreAllMocks());

  // =====================================================================
  // TESTE 1 — CHECKOUT FUNCIONA
  // =====================================================================
  it("cria checkout com sucesso", async () => {
    jest.spyOn(Reserva, "findById").mockReturnValue(
      mockFindById({
        usuario: "user01", // deve ser IGUAL ao token
        valor: 50,
        paymentStatus: "pendente",
        servico: { nome: "Corte", preco: 50 },
        barbearia: { nome: "Barbearia XPTO" },
      }) as any
    );

    const res = await request(app)
      .post("/api/pagamento/checkout")
      .set("Authorization", tokenValido)
      .send({ reservaId: "64b000000000000000000123" });

    expect(res.status).toBe(200);
    expect(res.body.url).toContain("stripe");
  });

  // =====================================================================
  // TESTE 2 — WEBHOOK VÁLIDO
  // =====================================================================
  it("confirma reserva com webhook válido", async () => {
    const saveMock = jest.fn();

    jest.spyOn(Reserva, "findById").mockResolvedValue({
      status: "pendente",
      paymentStatus: "pendente",
      save: saveMock,
    } as any);

    const res = await request(app)
      .post("/api/pagamento/webhook")
      .set("stripe-signature", "abc")
      .send(Buffer.from("{}"));

    expect(res.status).toBe(200);
    expect(saveMock).toHaveBeenCalled();
  });

  // =====================================================================
// TESTE 3 — WEBHOOK INVÁLIDO → 400
// =====================================================================
it("retorna 400 se assinatura Stripe for inválida", async () => {
  // importa stripe real usado pelo controller
  const controllerStripe = require("../controllers/pagamento.controller").stripe;

  // mock correto no stripe usado pelo controller
  controllerStripe.webhooks.constructEvent = jest.fn(() => {
    throw new Error("Assinatura inválida");
  });

  // impede cast inválido do mongoose
  jest.spyOn(Reserva, "findById").mockResolvedValue(null);

  const res = await request(app)
    .post("/api/pagamento/webhook")
    .set("stripe-signature", "errada")
    .send(Buffer.from("{}")); // RAW body

  expect(res.status).toBe(400);
});
});
