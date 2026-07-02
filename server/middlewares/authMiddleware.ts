//server/middlewares/authMiddleware.ts


// =============================================================
// 🔐 Auth middleware — compatível (named exports + default)
// -------------------------------------------------------------
// Exports:
//  - export interface AuthenticatedRequest
//  - export const verifyToken
//  - export const requireRole
//  - export default verifyToken (compatibilidade)
// =============================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const JWT_SECRET = env.JWT_SECRET;

// Tipagem estendida para Request usada pelo resto do projeto
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    tipo?: "admin" | "barbeiro" | "cliente";
    email?: string;
    [key: string]: any;
  };
}

/**
 * verifyToken — middleware principal (named export)
 * - aceita cabeçalho "Authorization: Bearer <token>"
 * - aceita também apenas o token (por segurança)
 * - injeta req.userId e req.user (com dados do payload do token)
 */
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    const tokenRaw = typeof authHeader === "string" ? authHeader : undefined;

    if (!tokenRaw) {
      console.warn("⚠️ Token não fornecido.");
      return res.status(401).json({ error: "Token não fornecido." });
    }

    // Suporta "Bearer <token>" e também apenas o token
    const parts = tokenRaw.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (!token) {
      console.warn("⚠️ Token vazio no header Authorization.");
      return res.status(401).json({ error: "Token inválido." });
    }

    // Verifica token (lança se inválido/expirado)
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Normaliza IDs do payload caso existam (id, _id, sub)
    const userId = decoded.id || decoded._id || decoded.sub;
    if (!userId) {
      console.error("❌ Payload do token sem user id:", decoded);
      return res.status(401).json({ error: "Token inválido." });
    }

    // Injeta no req para uso posterior
    req.userId = String(userId);
    req.user = {
      id: String(userId),
      tipo: decoded.tipo,
      email: decoded.email,
      ...decoded,
    };

    // continue
    next();
  } catch (err: any) {
    console.error("❌ Erro ao verificar token:", err && err.message ? err.message : err);
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};

/**
 * requireRole(role) — middleware que exige um tipo específico de usuário
 * Ex: app.get('/admin', verifyToken, requireRole('admin'), handler)
 */
export const requireRole =
  (role: "admin" | "barbeiro" | "cliente") =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }
    if (req.user.tipo !== role) {
      return res.status(403).json({ error: `Acesso negado: apenas ${role}s.` });
    }
    next();
  };

// para compatibilidade com imports por default (import authMiddleware from "...";)
export default verifyToken;
