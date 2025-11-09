import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  nomeCompleto: string;
  email: string;
  tipo: "cliente" | "barbeiro" | "admin";
  fotoUrl?: string;
  telefone?: string;
  criadoEm: Date;
}

const UserSchema = new Schema<IUser>({
  nomeCompleto: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ["cliente", "barbeiro", "admin"], default: "cliente" },
  fotoUrl: String,
  telefone: String,
  criadoEm: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", UserSchema);