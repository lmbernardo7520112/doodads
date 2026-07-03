import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBookingPolicy extends Document {
  barbeariaId: Types.ObjectId;
  requirePrepayment: boolean;
  paymentExpirationMinutes: number;
  arrivalToleranceMinutes: number;
  cancellationWindowHours: number;
  refundPolicy: "full_refund_until_window" | "partial_refund_until_window" | "no_refund_after_window" | "manual_review";
  noShowPolicy: "mark_no_show_after_tolerance" | "manual_review";
  policyVersion: string;
  activeFrom: Date;
  activeUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingPolicySchema = new Schema<IBookingPolicy>(
  {
    barbeariaId: { type: Schema.Types.ObjectId, ref: "Barbearia", required: true, index: true },
    requirePrepayment: { type: Boolean, default: false },
    paymentExpirationMinutes: { type: Number, min: 1, max: 120, default: 15 },
    arrivalToleranceMinutes: { type: Number, min: 0, max: 60, default: 15 },
    cancellationWindowHours: { type: Number, min: 0, max: 168, default: 2 },
    refundPolicy: {
      type: String,
      enum: ["full_refund_until_window", "partial_refund_until_window", "no_refund_after_window", "manual_review"],
      required: true,
      default: "no_refund_after_window",
    },
    noShowPolicy: {
      type: String,
      enum: ["mark_no_show_after_tolerance", "manual_review"],
      required: true,
      default: "mark_no_show_after_tolerance",
    },
    policyVersion: { type: String, required: true },
    activeFrom: { type: Date, required: true },
    activeUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BookingPolicySchema.index({ barbeariaId: 1, isActive: 1 });

export default mongoose.model<IBookingPolicy>("BookingPolicy", BookingPolicySchema);
