import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVoiceLog extends Document {
  usuario: Types.ObjectId;
  textoReconhecido: string;
  intencao: any;
  sucesso: boolean;
  erro?: string;
  dataHora: Date;
}

const VoiceLogSchema = new Schema<IVoiceLog>({
  usuario: { type: Schema.Types.ObjectId, ref: "User" },
  textoReconhecido: String,
  intencao: Schema.Types.Mixed,
  sucesso: Boolean,
  erro: String,
  dataHora: { type: Date, default: Date.now }
});

export default mongoose.model<IVoiceLog>("VoiceLog", VoiceLogSchema);