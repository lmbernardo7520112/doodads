import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBookingPayment extends Document {
  reservaId: Types.ObjectId;
  barbeariaId: Types.ObjectId;
  provider: "manual" | "banco_api_pix" | "mercado_pago" | "asaas" | "efipay" | "outro";
  providerPaymentId?: string;
  providerPaymentReference?: string;
  amountCents: number;
  currency: "BRL";
  status: "pending" | "paid" | "expired" | "cancelled" | "refunded" | "failed" | "manual_review";
  pixQrCodeRef?: string;
  pixCopyPasteRef?: string;
  expiresAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  failedAt?: Date;
  webhookEventId?: string;
  idempotencyKey?: string;
  metadataSafe?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const BookingPaymentSchema = new Schema<IBookingPayment>(
  {
    reservaId: { type: Schema.Types.ObjectId, ref: "Reserva", required: true, index: true },
    barbeariaId: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true, index: true },
    provider: {
      type: String,
      enum: ["manual", "banco_api_pix", "mercado_pago", "asaas", "efipay", "outro"],
      required: true,
    },
    providerPaymentId: { type: String, sparse: true, index: true },
    providerPaymentReference: { type: String },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["BRL"], default: "BRL", required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "expired", "cancelled", "refunded", "failed", "manual_review"],
      required: true,
      default: "pending",
    },
    pixQrCodeRef: { type: String },
    pixCopyPasteRef: { type: String },
    expiresAt: { type: Date, index: true },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    failedAt: { type: Date },
    webhookEventId: { type: String, sparse: true, index: true },
    idempotencyKey: { type: String, sparse: true, index: true },
    metadataSafe: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Índice composto para queries de expiração
BookingPaymentSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<IBookingPayment>("BookingPayment", BookingPaymentSchema);
