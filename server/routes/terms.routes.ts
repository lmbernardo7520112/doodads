// =============================================================
// 📜 terms.routes.ts
// -------------------------------------------------------------
// Endpoint público para buscar a TermsVersion ativa por tipo.
// Usado pelo frontend para exibir termos antes da reserva.
// =============================================================

import { Router, Request, Response } from "express";
import { termsVersionRepository } from "../repositories/termsVersion.repository";

const router = Router();

/**
 * GET /api/terms/active?type=booking_payment_terms
 *
 * Retorna a TermsVersion ativa do tipo solicitado.
 * Campos sensíveis (contentHash) são omitidos.
 * Endpoint público — não requer autenticação.
 */
router.get("/active", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const validTypes = ["booking_payment_terms", "cancellation_policy", "no_show_policy", "privacy_policy"];
    if (!type || typeof type !== "string" || !validTypes.includes(type)) {
      return res.status(400).json({
        error: `Tipo inválido. Valores aceitos: ${validTypes.join(", ")}`,
      });
    }

    const termsVersion = await termsVersionRepository.findActiveByType(type);
    if (!termsVersion) {
      return res.status(404).json({ error: "Nenhuma versão de termos ativa encontrada para este tipo." });
    }

    // Retorna dados seguros (sem contentHash interno)
    return res.status(200).json({
      _id: termsVersion._id,
      type: termsVersion.type,
      version: termsVersion.version,
      title: termsVersion.title,
      content: termsVersion.content,
      effectiveFrom: termsVersion.effectiveFrom,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar termos ativos:", error);
    return res.status(500).json({ error: "Erro interno ao buscar termos." });
  }
});

export default router;
