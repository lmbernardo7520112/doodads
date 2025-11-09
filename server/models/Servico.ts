import mongoose, { Schema, Document, Types } from "mongoose";

export interface IServico extends Document {
  barbearia: Types.ObjectId;
  nome: string;
  duracaoMin: number;
  preco: number;
  descricao?: string;
  ativo: boolean;
}

const ServicoSchema = new Schema<IServico>({
  barbearia: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true },
  nome: { type: String, required: true },
  duracaoMin: { type: Number, required: true },
  preco: { type: Number, required: true },
  descricao: String,
  ativo: { type: Boolean, default: true }
});

export default mongoose.model<IServico>("Servico", ServicoSchema);