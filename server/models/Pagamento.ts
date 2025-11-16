//server/models/Pagamentos.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPagamento extends Document {
  reserva: Types.ObjectId;
  stripeSessionId: string;
  status: "pendente" | "pago" | "falhou" | "reembolsado";
  valor: number;
  metodo: string;
  criadoEm: Date;
}

const PagamentoSchema = new Schema<IPagamento>({
  reserva: { type: Schema.Types.ObjectId, ref: "Reserva", required: true },
  stripeSessionId: { type: String, required: true },
  status: { type: String, enum: ["pendente", "pago", "falhou", "reembolsado"], default: "pendente" },
  valor: { type: Number, required: true },
  metodo: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now }
});

export default mongoose.model<IPagamento>("Pagamento", PagamentoSchema);