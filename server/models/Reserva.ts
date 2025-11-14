// =============================================================
// 📁 server/models/Reserva.ts
// -------------------------------------------------------------
// Modelo Mongoose da Reserva — compatível com PRD-004
// =============================================================

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReserva extends Document {
  usuario: Types.ObjectId;
  barbearia: Types.ObjectId;
  servico: Types.ObjectId;
  dataHora: Date;
  status: "pendente" | "confirmado" | "cancelado" | "finalizado";
  valor?: number;
  criadoEm: Date;
  canceladoEm?: Date;
}

const ReservaSchema = new Schema<IReserva>(
  {
    usuario: { type: Schema.Types.ObjectId, ref: "User", required: true },
    barbearia: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true },
    servico: { type: Schema.Types.ObjectId, ref: "Servico", required: true },
    dataHora: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pendente", "confirmado", "cancelado", "finalizado"],
      default: "pendente", // ✅ status inicial padronizado
      required: true,
    },
    valor: { type: Number },
    criadoEm: { type: Date, default: Date.now },
    canceladoEm: { type: Date },
  },
  {
    collection: "reservas",
    // timestamps adiciona createdAt/updatedAt automaticamente (não substitui criadoEm,
    // mas ajuda no auditing). Mantive criadoEm para compatibilidade.
    timestamps: true,
  }
);

// índice para evitar colisões óbvias por barbearia+dataHora
ReservaSchema.index({ barbearia: 1, dataHora: 1 });

// Pre-save hardening: garante que, se por algum motivo status vier vazio, definimos "pendente".
ReservaSchema.pre("save", function (next) {
  if (!this.status) {
    this.status = "pendente";
  }
  next();
});

export default mongoose.model<IReserva>("Reserva", ReservaSchema);
