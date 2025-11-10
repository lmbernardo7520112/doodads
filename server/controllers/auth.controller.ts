//server/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

/**
 * Registro de novo usuário
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { nomeCompleto, email, senha, tipo, telefone } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Usuário já registrado." });
    }

    const hashed = await bcrypt.hash(senha, 10);
    const novoUsuario = await User.create({
      nomeCompleto,
      email,
      senha: hashed,
      tipo,
      telefone,
    });

    return res.status(201).json({ message: "Usuário criado com sucesso!", user: novoUsuario });
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

/**
 * Login e geração de token JWT
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (!usuario.senha) {
      return res.status(500).json({ message: "Usuário sem senha cadastrada." });
    }

    const isMatch = await bcrypt.compare(senha, usuario.senha);
    if (!isMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: usuario._id, tipo: usuario.tipo, email: usuario.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

/**
 * Perfil do usuário autenticado
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    // O usuário vem injetado pelo middleware verifyToken
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Token inválido ou usuário não autenticado." });
    }

    const usuario = await User.findById(userId).select("-senha");

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao obter perfil:", error);
    return res.status(500).json({ message: "Erro ao obter perfil do usuário." });
  }
};

