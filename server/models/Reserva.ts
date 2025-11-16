// =============================================================
// 📁 server/models/Reserva.ts
// -------------------------------------------------------------
// Modelo Mongoose da Reserva — PRD-004 + Stripe-ready
// (Atualizado: adiciona cancelReason para auditoria)
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
  cancelReason?: string;

  // 🔹 Stripe
  paymentId?: string;
  paymentStatus?: "pendente" | "aprovado" | "falhou";
  confirmadoEm?: Date;
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
      default: "pendente",
      required: true,
    },

    valor: { type: Number },
    criadoEm: { type: Date, default: Date.now },

    // cancel
    canceladoEm: { type: Date },
    cancelReason: { type: String, maxlength: 500 },

    // Stripe
    paymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pendente", "aprovado", "falhou"],
      default: "pendente",
    },
    confirmadoEm: { type: Date },
  },
  {
    collection: "reservas",
    timestamps: true,
  }
);

// índice para barbearia + dataHora
ReservaSchema.index({ barbearia: 1, dataHora: 1 });

// Hardening default
ReservaSchema.pre("save", function (next) {
  if (!this.status) this.status = "pendente";
  next();
});

export default mongoose.model<IReserva>("Reserva", ReservaSchema);
