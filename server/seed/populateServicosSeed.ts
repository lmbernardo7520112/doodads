import mongoose from "mongoose";
import dotenv from "dotenv";
import Servico from "../models/Servico";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/doodads";

async function seed() {
  await mongoose.connect(MONGO_URI);
  await Servico.deleteMany({});

  const barbeariaId = "69132428e6206b6318ce5f4b"; // substitua pelo seu

  await Servico.insertMany([
    { nome: "Corte Masculino", preco: 35, duracaoMin: 30, barbearia: barbeariaId },
    { nome: "Barba Completa", preco: 25, duracaoMin: 20, barbearia: barbeariaId },
    { nome: "Corte + Barba", preco: 55, duracaoMin: 50, barbearia: barbeariaId },
  ]);

  console.log("✅ Serviços inseridos com sucesso!");
  await mongoose.disconnect();
}

seed();
