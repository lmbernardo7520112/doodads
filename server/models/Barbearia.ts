import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBarbearia extends Document {
  nome: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    cep: string;
  };
  telefone1: string;
  telefone2?: string;
  descricao?: string;
  barbeiro: Types.ObjectId;
  ativo: boolean;
  criadoEm: Date;
}

const BarbeariaSchema = new Schema<IBarbearia>({
  nome: { type: String, required: true },
  endereco: {
    rua: String,
    numero: String,
    bairro: String,
    cidade: String,
    cep: String
  },
  telefone1: { type: String, required: true },
  telefone2: String,
  descricao: String,
  barbeiro: { type: Schema.Types.ObjectId, ref: "User" },
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now }
});

export default mongoose.model<IBarbearia>("Barbearia", BarbeariaSchema);