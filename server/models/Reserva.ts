import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReserva extends Document {
  usuario: Types.ObjectId;
  barbearia: Types.ObjectId;
  servico: Types.ObjectId;
  dataHora: Date;
  status: "pendente" | "confirmado" | "cancelado" | "finalizado";
  valor: number;
  criadoEm: Date;
  canceladoEm?: Date;
}

const ReservaSchema = new Schema<IReserva>({
  usuario: { type: Schema.Types.ObjectId, ref: "User", required: true },
  barbearia: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true },
  servico: { type: Schema.Types.ObjectId, ref: "Servico", required: true },
  dataHora: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pendente", "confirmado", "cancelado", "finalizado"],
    default: "pendente"
  },
  valor: Number,
  criadoEm: { type: Date, default: Date.now },
  canceladoEm: Date
});

ReservaSchema.index({ barbearia: 1, dataHora: 1 });

export default mongoose.model<IReserva>("Reserva", ReservaSchema);