//server/models/Barbearia.ts

// =============================================================
// 💈 models/Barbearia.ts
// -------------------------------------------------------------
// Modelo Mongoose de Barbearia — compatível com frontend React.
// Inclui imagem, telefones, endereço completo e barbeiro vinculado.
// =============================================================

import mongoose, { Schema, Document, Types } from "mongoose";

// =============================================================
// 🧱 Interface de Endereço (subdocumento)
// -------------------------------------------------------------
interface IEndereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
}

// =============================================================
// 💇‍♂️ Interface principal da Barbearia
// -------------------------------------------------------------
export interface IBarbearia extends Document {
  nome: string;
  imagem?: string; // ✅ URL da imagem pública (YouTube, Cloudinary, etc.)
  endereco: IEndereco;
  telefone1: string;
  telefone2?: string;
  descricao?: string;
  barbeiro?: Types.ObjectId; // Referência ao User
  ativo: boolean;
  criadoEm: Date;
}

// =============================================================
// 🧩 Schema de Endereço
// -------------------------------------------------------------
const EnderecoSchema = new Schema<IEndereco>(
  {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    cep: { type: String, required: true },
  },
  { _id: false }
);

// =============================================================
// 🧱 Schema principal da Barbearia
// -------------------------------------------------------------
const BarbeariaSchema = new Schema<IBarbearia>(
  {
    nome: {
      type: String,
      required: [true, "O nome da barbearia é obrigatório"],
      trim: true,
      maxlength: [100, "O nome não pode exceder 100 caracteres"],
    },
    imagem: {
      type: String,
      trim: true,
      default: "https://i.ytimg.com/vi/X1_2e8FOW2Y/maxresdefault.jpg", // ✅ placeholder padrão
    },
    endereco: {
      type: EnderecoSchema,
      required: true,
    },
    telefone1: {
      type: String,
      required: [true, "Pelo menos um telefone é obrigatório"],
    },
    telefone2: { type: String },
    descricao: { type: String, maxlength: 500 },
    barbeiro: { type: Schema.Types.ObjectId, ref: "User", required: false },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
  },
  { collection: "barbearias" }
);

// =============================================================
// 🚀 Exportação do modelo
// -------------------------------------------------------------
export default mongoose.model<IBarbearia>("Barbearia", BarbeariaSchema);
