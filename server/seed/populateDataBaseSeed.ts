// =============================================================
// 📜 seed.ts — Popula o banco doodads_db (Aparatu)
// -------------------------------------------------------------
// Cria usuários, barbearia, serviços, reserva, pagamento, etc.
// Garante integridade de relacionamentos e gera collections.
// =============================================================

import "dotenv/config";
import { connectToMongo } from "../config/db";
import User from "../models/User";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import Reserva from "../models/Reserva";
import Pagamento from "../models/Pagamento";
import Mensagem from "../models/Mensagem";
import VoiceLog from "../models/VoiceLog";

(async () => {
  try {
    await connectToMongo();

    console.log("🧹 Limpando dados anteriores...");
    await Promise.all([
      User.deleteMany({}),
      Barbearia.deleteMany({}),
      Servico.deleteMany({}),
      Reserva.deleteMany({}),
      Pagamento.deleteMany({}),
      Mensagem.deleteMany({}),
      VoiceLog.deleteMany({})
    ]);

    // ==========================================================
    // 👥 Criação de Usuários
    // ==========================================================

    const admin = await User.create({
      nomeCompleto: "Administrador Geral",
      email: "admin@aparatu.com",
      tipo: "admin",
    });

    const barbeiro = await User.create({
      nomeCompleto: "Leonardo Maximino",
      email: "leonardo@barber.com",
      tipo: "barbeiro",
      telefone: "+55 83 99999-0000"
    });

    const cliente = await User.create({
      nomeCompleto: "João da Silva",
      email: "joao@cliente.com",
      tipo: "cliente",
      telefone: "+55 83 98888-1234"
    });

    console.log("✅ Usuários criados:", { admin, barbeiro, cliente });

    // ==========================================================
    // 💈 Criação de Barbearia
    // ==========================================================

    const barbearia = await Barbearia.create({
      nome: "Barbearia Estilo Fino",
      endereco: {
        rua: "Rua das Acácias",
        numero: "123",
        bairro: "Centro",
        cidade: "João Pessoa",
        cep: "58000-000"
      },
      telefone1: "+55 83 3333-0001",
      telefone2: "+55 83 3333-0002",
      descricao: "A melhor barbearia da cidade, com conforto e estilo.",
      barbeiro: barbeiro._id,
      ativo: true
    });

    console.log("💈 Barbearia criada:", barbearia.nome);

    // ==========================================================
    // ✂️ Criação de Serviços
    // ==========================================================

    const servicos = await Servico.insertMany([
      {
        barbearia: barbearia._id,
        nome: "Corte Clássico",
        duracaoMin: 30,
        preco: 40,
        descricao: "Corte tradicional com finalização e estilo.",
      },
      {
        barbearia: barbearia._id,
        nome: "Barba Completa",
        duracaoMin: 25,
        preco: 35,
        descricao: "Barba desenhada e aparada com toalha quente.",
      },
      {
        barbearia: barbearia._id,
        nome: "Corte + Barba Premium",
        duracaoMin: 60,
        preco: 70,
        descricao: "Combo completo para o visual perfeito.",
      }
    ]);

    console.log("✂️ Serviços criados:", servicos.map(s => s.nome));

    // ==========================================================
    // 📅 Criação de Reserva
    // ==========================================================

    const reserva = await Reserva.create({
      usuario: cliente._id,
      barbearia: barbearia._id,
      servico: servicos[0]._id,
      dataHora: new Date(Date.now() + 24 * 60 * 60 * 1000), // amanhã
      status: "confirmado",
      valor: servicos[0].preco
    });

    console.log("📅 Reserva criada:", reserva._id);

    // ==========================================================
    // 💳 Criação de Pagamento
    // ==========================================================

    const pagamento = await Pagamento.create({
      reserva: reserva._id,
      stripeSessionId: "sess_abc123",
      status: "pago",
      valor: reserva.valor,
      metodo: "cartao",
    });

    console.log("💳 Pagamento registrado:", pagamento.status);

    // ==========================================================
    // 💬 Criação de Mensagem
    // ==========================================================

    const mensagem = await Mensagem.create({
      reserva: reserva._id,
      remetente: cliente._id,
      conteudo: "Olá! Posso levar meu filho junto ao horário?",
    });

    console.log("💬 Mensagem criada:", mensagem._id);

    // ==========================================================
    // 🎙️ Criação de Log de Voz (Agenda.ai)
    // ==========================================================

    const voiceLog = await VoiceLog.create({
      usuario: cliente._id,
      textoReconhecido: "Agendar corte amanhã às 10h",
      intencao: {
        acao: "agendar_servico",
        servico: "Corte Clássico",
        data: "2025-11-11",
        hora: "10:00",
        barbearia: "Barbearia Estilo Fino"
      },
      sucesso: true
    });

    console.log("🎙️ VoiceLog criado:", voiceLog._id);

    console.log("\n✅ Seed concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  }
})();
