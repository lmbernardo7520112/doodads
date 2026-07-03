import mongoose, { Schema, Document } from "mongoose";

export interface ITermsVersion extends Document {
  type: "booking_payment_terms" | "cancellation_policy" | "no_show_policy" | "privacy_policy";
  version: string;
  title: string;
  content: string;
  contentHash: string;
  effectiveFrom: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TermsVersionSchema = new Schema<ITermsVersion>(
  {
    type: {
      type: String,
      enum: ["booking_payment_terms", "cancellation_policy", "no_show_policy", "privacy_policy"],
      required: true,
    },
    version: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },
    effectiveFrom: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TermsVersionSchema.index({ type: 1, version: 1 });
TermsVersionSchema.index({ type: 1, isActive: 1 });

export default mongoose.model<ITermsVersion>("TermsVersion", TermsVersionSchema);
