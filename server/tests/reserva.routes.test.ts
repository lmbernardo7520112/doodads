// =============================================================
// 📌 tests/reserva.routes.test.ts — PRD-004 Completo
// =============================================================
import mongoose from "mongoose";
import request from "supertest";
import app from "../App";

import { startTestDB, stopTestDB, clearDB } from "./test-setup";

import User from "../models/User";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import Reserva from "../models/Reserva";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { env } from "../config/env";
const JWT_SECRET = env.JWT_SECRET;

let token: string;
let userId: string;
let barbeariaId: string;
let servicoId: string;

beforeAll(async () => {
  await startTestDB();

  const user = await User.create({
    nomeCompleto: "Cliente Test",
    email: "cliente@t.com",
    senha: "123456",
    tipo: "cliente",
  } as any);

  userId = user._id.toString();

  token = jwt.sign(
    { id: userId, tipo: "cliente", email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const b = await Barbearia.create({
  nome: "Barbearia Test",
  imagem: "",
  telefone1: "11999999999",
  endereco: {
    rua: "Rua A",
    numero: "10",
    bairro: "Centro",
    cidade: "Cidade X",
    cep: "00000-000",
  },
} as any);


  barbeariaId = b._id.toString();

  const s = await Servico.create({
    nome: "Corte Degradê",
    preco: 40,
    duracaoMin: 30,
    barbearia: new mongoose.Types.ObjectId(barbeariaId),
  } as any);

  servicoId = s._id.toString();
});

afterEach(async () => {
  await mongoose.connection.dropCollection("reservas");
});

afterAll(async () => {
  await stopTestDB();
});

// =============================================================
// 🧪 Testes PRD-004
// =============================================================

describe("Reserva routes — PRD-004", () => {

  // 1️⃣ Criar reserva pendente
  it("cria reserva com status 'pendente' via POST /api/reservas", async () => {
    const data = {
      barbearia: barbeariaId,
      servico: servicoId,
      dataHora: new Date(Date.now() + 86400000).toISOString(),
    };

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send(data);

    expect(res.status).toBe(201);
    expect(res.body.reserva.status).toBe("pendente");
  });

  // 2️⃣ Bloqueio de horários ocupados
  it("retorna slots disponíveis bloqueando horários ocupados", async () => {
    const hoje = new Date();
    const dateStr = hoje.toISOString().split("T")[0];

    await Reserva.create({
      usuario: new mongoose.Types.ObjectId(userId),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(`${dateStr}T09:00:00`),
      status: "confirmado",
      valor: 40,
    } as any);

    const res = await request(app)
      .get(`/api/reservas/${barbeariaId}/slots`)
      .query({ date: dateStr, servicoId });

    expect(res.status).toBe(200);
    expect(res.body.slots).not.toContain("09:00");
  });

  // 3️⃣ Rota /reservas/minhas retorna apenas do usuário logado
  it("retorna APENAS as reservas do usuário autenticado via GET /api/reservas/minhas", async () => {
    await Reserva.create({
      usuario: new mongoose.Types.ObjectId(userId),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(Date.now() + 86400000),
      status: "pendente",
      valor: 40,
    });

    // Reserva de outro usuário
    await Reserva.create({
      usuario: new mongoose.Types.ObjectId(),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(Date.now() + 86400000),
      status: "pendente",
      valor: 40,
    });

    const res = await request(app)
      .get("/api/reservas/minhas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  // 4️⃣ Sem token → 401
  it("bloqueia acesso sem token", async () => {
    const res = await request(app).get("/api/reservas/minhas");
    expect(res.status).toBe(401);
  });

  // 5️⃣ Data no passado
  it("rejeita reserva com data no passado", async () => {
    const passado = new Date();
    passado.setDate(passado.getDate() - 1);

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: barbeariaId,
        servico: servicoId,
        dataHora: passado.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("PAST_DATE");
  });

  // 6️⃣ Barbearia / Serviço inexistentes
  it("rejeita reserva com barbearia inexistente", async () => {
    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: new mongoose.Types.ObjectId().toString(),
        servico: servicoId,
        dataHora: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("BARBEARIA_NOT_FOUND");
  });

  it("rejeita reserva com servico inexistente ou de outra barbearia", async () => {
    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: barbeariaId,
        servico: new mongoose.Types.ObjectId().toString(),
        dataHora: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SERVICO_NOT_FOUND");
  });

  // 7️⃣ Conflito ignora cancelado e considera duração
  it("ignora reserva cancelada e permite criar no mesmo slot", async () => {
    const dataHora = new Date(Date.now() + 86400000).toISOString();
    
    await Reserva.create({
      usuario: new mongoose.Types.ObjectId(userId),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(dataHora),
      status: "cancelado", // CANCELADA
    });

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        barbearia: barbeariaId,
        servico: servicoId,
        dataHora,
      });

    expect(res.status).toBe(201);
  });

  // 8️⃣ Cancelamento regras
  it("bloqueia cancelamento de reserva finalizada", async () => {
    const r = await Reserva.create({
      usuario: new mongoose.Types.ObjectId(userId),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(Date.now() + 86400000),
      status: "finalizado",
    });

    const res = await request(app)
      .patch(`/api/reservas/${r._id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("ALREADY_FINALIZED");
  });

  it("bloqueia cancelamento de reserva paga", async () => {
    const r = await Reserva.create({
      usuario: new mongoose.Types.ObjectId(userId),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(Date.now() + 86400000),
      status: "confirmado",
      paymentStatus: "aprovado",
    });

    const res = await request(app)
      .patch(`/api/reservas/${r._id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("ALREADY_PAID_CANCEL");
  });
  // 9️⃣ Ownership e Permissões
  it("cliente não pode cancelar reserva de outro", async () => {
    const r = await Reserva.create({
      usuario: new mongoose.Types.ObjectId(), // another user
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(Date.now() + 86400000),
      status: "pendente",
    });

    const res = await request(app)
      .patch(`/api/reservas/${r._id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN_CANCEL");
  });

  // 🔟 Status Lifecycle adicionais
  it("bloqueia cancelamento de reserva já cancelada", async () => {
    const r = await Reserva.create({
      usuario: new mongoose.Types.ObjectId(userId),
      barbearia: new mongoose.Types.ObjectId(barbeariaId),
      servico: new mongoose.Types.ObjectId(servicoId),
      dataHora: new Date(Date.now() + 86400000),
      status: "cancelado",
    });

    const res = await request(app)
      .patch(`/api/reservas/${r._id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("ALREADY_CANCELLED");
  });

});
