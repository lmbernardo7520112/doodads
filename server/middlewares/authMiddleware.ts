//server/middlewares/authMiddleware.ts

// =============================================================
// 🚀 index.ts
// -------------------------------------------------------------
// Configuração principal do servidor Express + Mongo + Auth.
// =============================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

// =============================================================
// 🔐 Tipagem estendida da Request
// -------------------------------------------------------------
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    tipo: "admin" | "barbeiro" | "cliente";
    email: string;
  };
}

// =============================================================
// ✅ Middleware principal: valida o token e injeta req.userId
// -------------------------------------------------------------
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.warn("⚠️ Token não fornecido.");
    return res.status(401).json({ error: "Token não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.id || decoded._id || decoded.sub;

    if (!userId) {
      console.error("❌ Token inválido — sem ID de usuário:", decoded);
      return res.status(401).json({ error: "Token inválido." });
    }

    req.userId = userId;
    req.user = {
      id: userId,
      tipo: decoded.tipo,
      email: decoded.email,
    };

    console.log("✅ Token verificado para:", decoded.email || userId);
    next();
  } catch (err: any) {
    console.error("❌ Token expirado ou inválido:", err.message);
    return res.status(401).json({ error: "Token expirado ou inválido." });
  }
};

// =============================================================
// ✅ Middleware adicional: exige tipo de usuário específico
// -------------------------------------------------------------
export const requireRole = (role: "admin" | "barbeiro" | "cliente") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (req.user.tipo !== role) {
      return res
        .status(403)
        .json({ error: `Acesso negado: apenas ${role}s podem acessar.` });
    }

    next();
  };
};
