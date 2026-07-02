//server/controllers/auth.controller.ts

// =============================================================
// 🔐 controllers/auth.controller.ts
// -------------------------------------------------------------
// Login, registro e renovação segura de tokens JWT
// =============================================================
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { env } from "../config/env";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

// =============================================================
// 🧩 Funções utilitárias
// -------------------------------------------------------------
function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// =============================================================
// 🧾 Registro
// -------------------------------------------------------------
export const register = async (req: Request, res: Response) => {
  try {
    const { nomeCompleto, email, senha, telefone } = req.body;
    if (!email || !senha)
      return res.status(400).json({ message: "Email e senha são obrigatórios." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Usuário já registrado." });

    const hashed = await bcrypt.hash(senha, 10);
    const novoUsuario = await User.create({
      nomeCompleto,
      email,
      senha: hashed,
      tipo: "cliente", // Forçado server-side por segurança
      telefone,
    });

    return res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: novoUsuario,
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

// =============================================================
// 🔑 Login
// -------------------------------------------------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const usuario = await User.findOne({ email });
    if (!usuario)
      return res.status(404).json({ message: "Usuário não encontrado." });

    if (!usuario.senha)
      return res.status(400).json({ message: "Usuário sem senha cadastrada." });

    const isMatch = await bcrypt.compare(senha, usuario.senha);
    if (!isMatch) return res.status(401).json({ message: "Senha incorreta." });

    const token = generateToken({
      id: usuario._id,
      tipo: usuario.tipo,
      email: usuario.email,
    });

    return res.status(200).json({
      message: "Login bem-sucedido",
      token,
      user: {
        id: usuario._id,
        nomeCompleto: usuario.nomeCompleto,
        tipo: usuario.tipo,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

// =============================================================
// ♻️ Renovar Token
// -------------------------------------------------------------
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ message: "Token não fornecido." });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(404).json({ message: "Usuário não encontrado." });

    const newToken = generateToken({
      id: user._id,
      tipo: user.tipo,
      email: user.email,
    });

    res.status(200).json({ token: newToken });
  } catch (error: any) {
    console.error("Erro ao renovar token:", error);
    res.status(401).json({ message: "Token expirado ou inválido." });
  }
};

// =============================================================
// 👤 Perfil autenticado
// -------------------------------------------------------------
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId)
      return res.status(401).json({ message: "Token inválido ou ausente." });

    const usuario = await User.findById(userId).select("-senha");
    if (!usuario)
      return res.status(404).json({ message: "Usuário não encontrado." });

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao obter perfil:", error);
    res.status(500).json({ message: "Erro ao obter perfil." });
  }
};
