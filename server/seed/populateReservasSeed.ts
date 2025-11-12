// =============================================================
// 🌱 reservas.seed.ts — Popula o MongoDB com 5 reservas exemplo
// -------------------------------------------------------------
// Execução: npx ts-node server/seed/reservas.seed.ts
// =============================================================

import mongoose from "mongoose";
import dotenv from "dotenv";
import Reserva from "../models/Reserva";
import Barbearia from "../models/Barbearia";
import User from "../models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/doodads";

async function runSeed() {
  try {
    console.log("🚀 Conectando ao MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado com sucesso!");

    // Busca um barbeiro e um cliente existentes (ou cria mocks)
    const barbeiro =
      (await User.findOne({ tipo: "barbeiro" })) ||
      (await User.create({
        nomeCompleto: "Barbeiro Seed",
        email: "barbeiro@seed.com",
        senha: "123456",
        tipo: "barbeiro",
      }));

    const cliente =
      (await User.findOne({ tipo: "cliente" })) ||
      (await User.create({
        nomeCompleto: "Cliente Seed",
        email: "cliente@seed.com",
        senha: "123456",
        tipo: "cliente",
      }));

    // Busca uma barbearia existente ou cria uma
    const barbearia =
      (await Barbearia.findOne()) ||
      (await Barbearia.create({
        nome: "Barbearia Estilo Fino",
        imagem: "https://i.ytimg.com/vi/X1_2e8FOW2Y/maxresdefault.jpg",
        endereco: {
          rua: "Rua das Acácias",
          numero: "123",
          bairro: "Centro",
          cidade: "João Pessoa",
          cep: "58000-000",
        },
        telefone1: "+55 83 3333-0001",
        barbeiro: barbeiro._id,
        ativo: true,
      }));

    // Limpa reservas antigas
    await Reserva.deleteMany({});
    console.log("🧹 Reservas anteriores removidas.");

    // Datas incrementais (1 reserva por dia)
    const hoje = new Date();
    const reservas = Array.from({ length: 5 }, (_, i) => ({
      usuario: cliente._id,
      barbearia: barbearia._id,
      servico: new mongoose.Types.ObjectId(), // mock — substitua depois
      dataHora: new Date(hoje.getTime() + i * 24 * 60 * 60 * 1000),
      status: i < 2 ? "confirmado" : i === 2 ? "pendente" : "finalizado",
      valor: 50 + i * 10,
    }));

    // Inserção em lote
    await Reserva.insertMany(reservas);

    console.log(`✅ ${reservas.length} reservas criadas com sucesso!`);
    console.log(`📅 Exemplo de datas: ${reservas.map((r) => r.dataHora.toISOString())}`);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexão encerrada.");
  }
}

runSeed();
