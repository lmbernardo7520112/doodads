import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMensagem extends Document {
  reserva: Types.ObjectId;
  remetente: Types.ObjectId;
  conteudo: string;
  criadoEm: Date;
}

const MensagemSchema = new Schema<IMensagem>({
  reserva: { type: Schema.Types.ObjectId, ref: "Reserva", required: true },
  remetente: { type: Schema.Types.ObjectId, ref: "User", required: true },
  conteudo: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now }
});

export default mongoose.model<IMensagem>("Mensagem", MensagemSchema);