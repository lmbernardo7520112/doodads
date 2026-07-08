// =============================================================
// 📜 seed.ts — Popula o banco doodads_db (Aparatu)
// -------------------------------------------------------------
// Cria usuários, barbearia, serviços, reserva, pagamento, etc.
// Garante integridade de relacionamentos e gera collections.
// =============================================================

import "dotenv/config";
import mongoose from "mongoose";
import { connectToMongo } from "../config/db";
import User from "../models/User";
import Barbearia from "../models/Barbearia";
import Servico from "../models/Servico";
import Reserva from "../models/Reserva";
import Pagamento from "../models/Pagamento";
import Mensagem from "../models/Mensagem";
import bcrypt from "bcryptjs";
import VoiceLog from "../models/VoiceLog";
import BookingPolicy from "../models/BookingPolicy";
import BarbeariaPaymentConfig from "../models/BarbeariaPaymentConfig";
import TermsVersion from "../models/TermsVersion";
import TermsAcceptance from "../models/TermsAcceptance";
import BookingPayment from "../models/BookingPayment";

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
      VoiceLog.deleteMany({}),
      BookingPolicy.deleteMany({}),
      BarbeariaPaymentConfig.deleteMany({}),
      TermsVersion.deleteMany({}),
      TermsAcceptance.deleteMany({}),
      BookingPayment.deleteMany({})
    ]);

    // ==========================================================
    // 👥 Criação de Usuários
    // ==========================================================

    const defaultHash = bcrypt.hashSync("123456", 10);

    const admin = await User.create({
      nomeCompleto: "Administrador Geral",
      email: "admin@aparatu.com",
      senha: defaultHash,
      tipo: "admin",
    });

    const barbeiro = await User.create({
      nomeCompleto: "Leonardo Maximino",
      email: "leonardo@barber.com",
      senha: defaultHash,
      tipo: "barbeiro",
      telefone: "+55 83 99999-0000"
    });

    const cliente = await User.create({
      nomeCompleto: "João da Silva",
      email: "joao@cliente.com",
      senha: defaultHash,
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
    // ⚙️ Políticas e Configurações de Pagamento
    // ==========================================================

    const policy = await BookingPolicy.create({
      barbeariaId: barbearia._id,
      requirePrepayment: true,
      paymentExpirationMinutes: 15,
      arrivalToleranceMinutes: 15,
      cancellationWindowHours: 1,
      refundPolicy: "no_refund_after_window",
      noShowPolicy: "mark_no_show_after_tolerance",
      policyVersion: "v1.0",
      activeFrom: new Date(),
      isActive: true
    });

    const paymentConfig = await BarbeariaPaymentConfig.create({
      barbeariaId: barbearia._id,
      paymentMode: "manual_pix",
      provider: "manual",
      pixKeyMasked: "pix@barbeariaestilofino.com.br",
      status: "active"
    });

    const termsVersion = await TermsVersion.create({
      version: "v1.0",
      title: "Termos de Pré-pagamento Pix",
      content: "Ao reservar, você concorda em efetuar o pagamento via Pix em até 15 minutos para garantir o agendamento.",
      contentHash: "hash-v1.0",
      type: "booking_payment_terms",
      isActive: true,
      effectiveFrom: new Date()
    });

    console.log("⚙️ Políticas e Termos configurados:", { policy: policy._id, paymentConfig: paymentConfig._id, termsVersion: termsVersion._id });

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
    // 📅 Criação de Reserva (estado realista: pendente/pending)
    // ==========================================================

    const reservaId = new mongoose.Types.ObjectId();
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const bookingPayment = await BookingPayment.create({
      reservaId: reservaId,
      barbeariaId: barbearia._id,
      provider: "manual",
      amountCents: servicos[0].preco * 100,
      currency: "BRL",
      status: "pending",
      expiresAt: paymentExpiresAt,
    });

    const reserva = await Reserva.create({
      _id: reservaId,
      usuario: cliente._id,
      barbearia: barbearia._id,
      servico: servicos[0]._id,
      dataHora: new Date(Date.now() + 24 * 60 * 60 * 1000), // amanhã
      status: "pendente",
      valor: servicos[0].preco,
      paymentStatus: "pending",
      paymentRequired: true,
      bookingPaymentId: bookingPayment._id,
      paymentExpiresAt,
    });

    console.log("📅 Reserva criada (pendente, aguardando pagamento manual):", reserva._id);

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
