import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBarbeariaPaymentConfig extends Document {
  barbeariaId: Types.ObjectId;
  paymentMode: "manual_pix" | "pix_provider";
  provider: "manual" | "banco_api_pix" | "mercado_pago" | "asaas" | "efipay" | "outro";
  pixKeyMasked?: string;
  providerAccountRef?: string;
  credentialRef?: string;
  webhookSecretRef?: string;
  status: "pending" | "active" | "disabled";
  createdAt: Date;
  updatedAt: Date;
}

const BarbeariaPaymentConfigSchema = new Schema<IBarbeariaPaymentConfig>(
  {
    barbeariaId: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true, index: true },
    paymentMode: { type: String, enum: ["manual_pix", "pix_provider"], required: true },
    provider: {
      type: String,
      enum: ["manual", "banco_api_pix", "mercado_pago", "asaas", "efipay", "outro"],
      required: true,
    },
    pixKeyMasked: { type: String },
    providerAccountRef: { type: String },
    credentialRef: { type: String },
    webhookSecretRef: { type: String },
    status: { type: String, enum: ["pending", "active", "disabled"], required: true, default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IBarbeariaPaymentConfig>("BarbeariaPaymentConfig", BarbeariaPaymentConfigSchema);
