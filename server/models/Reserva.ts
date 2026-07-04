// =============================================================
// 📁 server/models/Reserva.ts
// -------------------------------------------------------------
// Modelo Mongoose da Reserva — PRD-004 + Payment fields (D1)
// (Atualizado: adiciona campos opcionais de pagamento/aceite
//  para suporte futuro ao fluxo manual_pix controlado)
// =============================================================

import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * paymentStatus legado (Stripe): "pendente" | "aprovado" | "falhou"
 * paymentStatus novo (manual_pix D1):
 *   "not_required" | "pending" | "paid" | "expired" | "refunded" | "failed" | "manual_review"
 *
 * Ambos coexistem no enum para retrocompatibilidade total.
 * Reservas existentes mantêm "pendente" (default legado).
 * Novas reservas com manual_pix usarão os valores em inglês.
 */
type PaymentStatusLegacy = "pendente" | "aprovado" | "falhou";
type PaymentStatusNew = "not_required" | "pending" | "paid" | "expired" | "refunded" | "failed" | "manual_review";
type PaymentStatus = PaymentStatusLegacy | PaymentStatusNew;

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

  // 🔹 Stripe (legado)
  paymentId?: string;
  paymentStatus?: PaymentStatus;
  confirmadoEm?: Date;

  // 🔹 Payment fields (D1 — manual_pix futuro)
  paymentRequired?: boolean;
  bookingPaymentId?: Types.ObjectId;
  termsAcceptanceId?: Types.ObjectId;
  paymentExpiresAt?: Date;
  confirmedAt?: Date;
  noShowMarkedAt?: Date;
  noShowMarkedBy?: Types.ObjectId;
  cancelledAt?: Date;
  completedAt?: Date;
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

    // Stripe (legado)
    paymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: [
        // Legado (retrocompatibilidade)
        "pendente", "aprovado", "falhou",
        // Novo (manual_pix D1)
        "not_required", "pending", "paid", "expired", "refunded", "failed", "manual_review",
      ],
      default: "pendente",
    },
    confirmadoEm: { type: Date },

    // Payment fields (D1 — campos opcionais para manual_pix futuro)
    paymentRequired: { type: Boolean, default: false },
    bookingPaymentId: { type: Schema.Types.ObjectId, ref: "BookingPayment" },
    termsAcceptanceId: { type: Schema.Types.ObjectId, ref: "TermsAcceptance" },
    paymentExpiresAt: { type: Date },
    confirmedAt: { type: Date },
    noShowMarkedAt: { type: Date },
    noShowMarkedBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
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
