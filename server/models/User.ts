import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  nomeCompleto: string;
  email: string;
  senha?: string; // ✅ opcional
  tipo: "admin" | "barbeiro" | "cliente";
  telefone?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nomeCompleto: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    senha: { type: String, required: true, minlength: 6 },
    tipo: { type: String, enum: ["admin", "barbeiro", "cliente"], required: true },
    telefone: { type: String },
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" } }
);

UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.senha;
    return ret;
  },
});

UserSchema.set("toObject", {
  transform: function (doc, ret) {
    delete ret.senha;
    return ret;
  },
});

export default mongoose.model<IUser>("User", UserSchema);

