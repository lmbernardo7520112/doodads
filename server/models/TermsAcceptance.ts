import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITermsAcceptance extends Document {
  reservaId: Types.ObjectId;
  barbeariaId: Types.ObjectId;
  userId?: Types.ObjectId;
  termsVersionId: Types.ObjectId;
  acceptedAt: Date;
  checkboxLabelSnapshot: string;
  acceptanceTextSnapshot: string;
  serviceSnapshot: {
    servicoNome: string;
    priceCents: number;
    scheduledAt: Date;
    durationMinutes?: number;
    arrivalToleranceMinutes?: number;
    paymentExpirationMinutes?: number;
    cancellationWindowHours?: number;
    refundPolicySummary?: string;
    noShowPolicySummary?: string;
  };
  clientIpHash?: string;
  userAgentHash?: string;
  source: "web" | "mobile" | "admin";
  locale?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TermsAcceptanceSchema = new Schema<ITermsAcceptance>(
  {
    reservaId: { type: Schema.Types.ObjectId, ref: "Reserva", required: true, index: true },
    barbeariaId: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    termsVersionId: { type: Schema.Types.ObjectId, ref: "TermsVersion", required: true, index: true },
    acceptedAt: { type: Date, required: true, index: true },
    checkboxLabelSnapshot: { type: String, required: true },
    acceptanceTextSnapshot: { type: String, required: true },
    serviceSnapshot: {
      servicoNome: { type: String, required: true },
      priceCents: { type: Number, required: true },
      scheduledAt: { type: Date, required: true },
      durationMinutes: { type: Number },
      arrivalToleranceMinutes: { type: Number },
      paymentExpirationMinutes: { type: Number },
      cancellationWindowHours: { type: Number },
      refundPolicySummary: { type: String },
      noShowPolicySummary: { type: String },
    },
    clientIpHash: { type: String },
    userAgentHash: { type: String },
    source: { type: String, enum: ["web", "mobile", "admin"], required: true },
    locale: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITermsAcceptance>("TermsAcceptance", TermsAcceptanceSchema);
