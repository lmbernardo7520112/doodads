// =============================================================
// 🔒 bookingPaymentManual.controller.ts
// -------------------------------------------------------------
// Controller fino para confirmação manual de pagamento.
// Delega toda lógica de negócio ao service.
// =============================================================

import { Request, Response } from "express";
import { bookingPaymentManualService } from "../services/bookingPaymentManual.service";
import { AppError } from "../errors/AppError";
import { presentPaymentStatus, presentReservaStatus } from "../presenters/statusPresenter";
import { z } from "zod";

const getUserInfo = (req: Request) => {
  const user = (req as any).user || {};
  return { id: user.id as string | undefined, tipo: user.tipo as string | undefined };
};

/**
 * PATCH /api/reservas/pagamento-manual/:bookingPaymentId/confirmar
 *
 * Confirma manualmente um pagamento pending → paid.
 * Apenas barbeiro proprietário da barbearia ou admin.
 * Delega validação completa ao service.
 */
export const confirmarPagamentoManual = async (req: Request, res: Response) => {
  try {
    const { id: userId, tipo: userTipo } = getUserInfo(req);

    if (!userId || !userTipo) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const { bookingPaymentId } = req.params;
    const { confirmationNote } = req.body;

    const result = await bookingPaymentManualService.confirmManualBookingPayment({
      bookingPaymentId,
      userId,
      userTipo: userTipo as "admin" | "barbeiro" | "cliente",
      confirmationNote,
    });

    return res.status(200).json({
      message: "Pagamento confirmado com sucesso.",
      bookingPayment: {
        id: result.bookingPayment._id,
        status: result.bookingPayment.status,
        paidAt: result.bookingPayment.paidAt,
        amountCents: result.bookingPayment.amountCents,
        currency: result.bookingPayment.currency,
        provider: result.bookingPayment.provider,
      },
      reserva: {
        id: result.reserva._id,
        status: result.reserva.status,
        paymentStatus: result.reserva.paymentStatus,
        confirmedAt: result.reserva.confirmedAt,
      },
      paymentStatusPresentation: presentPaymentStatus(result.bookingPayment.status),
      reservaStatusPresentation: presentReservaStatus(result.reserva.status),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error("Erro ao confirmar pagamento manual:", error);
    return res.status(500).json({ message: "Erro interno ao confirmar pagamento." });
  }
};

/**
 * PATCH /api/reservas/pagamento-manual/:bookingPaymentId/expirar
 *
 * Expira manualmente/administrativamente um pagamento manual pending vencido.
 * Apenas barbeiro proprietário da barbearia ou admin.
 * Delega validação completa ao service.
 */
export const expirarPagamentoManual = async (req: Request, res: Response) => {
  try {
    const { id: userId, tipo: userTipo } = getUserInfo(req);

    if (!userId || !userTipo) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const { bookingPaymentId } = req.params;

    const result = await bookingPaymentManualService.expireOverdueManualBookingPayment({
      bookingPaymentId,
      userId,
      userTipo: userTipo as "admin" | "barbeiro" | "cliente",
    });

    return res.status(200).json({
      message: "Pagamento expirado com sucesso.",
      bookingPayment: {
        id: result.bookingPayment._id,
        status: result.bookingPayment.status,
        expiresAt: result.bookingPayment.expiresAt,
        amountCents: result.bookingPayment.amountCents,
        currency: result.bookingPayment.currency,
        provider: result.bookingPayment.provider,
      },
      reserva: {
        id: result.reserva._id,
        status: result.reserva.status,
        paymentStatus: result.reserva.paymentStatus,
      },
      paymentStatusPresentation: presentPaymentStatus(result.bookingPayment.status),
      reservaStatusPresentation: presentReservaStatus(result.reserva.status),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error("Erro ao expirar pagamento manual:", error);
    return res.status(500).json({ message: "Erro interno ao expirar pagamento." });
  }
};

const listQuerySchema = z.object({
  status: z.enum(["pending", "paid", "expired", "cancelled", "refunded", "failed", "manual_review"]).optional(),
  overdueOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  manualReviewOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  limit: z.preprocess((val) => val ? parseInt(String(val), 10) : undefined, z.number().int().min(1).max(100)).optional(),
  page: z.preprocess((val) => val ? parseInt(String(val), 10) : undefined, z.number().int().min(1)).optional(),
}).strict();

/**
 * GET /api/barbearias/:barbeariaId/pagamentos-manuais
 *
 * Lista pagamentos manuais da barbearia.
 * Apenas barbeiro proprietário da barbearia ou admin.
 */
export const listarPagamentosManuaisBarbearia = async (req: Request, res: Response) => {
  try {
    const { id: userId, tipo: userTipo } = getUserInfo(req);

    if (!userId || !userTipo) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const { barbeariaId } = req.params;

    // Validar query parameters usando schema strict
    const parsedQuery = listQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        message: "Erro de validação de dados.",
        detalhes: parsedQuery.error.issues,
      });
    }

    const result = await bookingPaymentManualService.listarPagamentosManuais({
      barbeariaId,
      userId,
      userTipo: userTipo as "admin" | "barbeiro" | "cliente",
      ...parsedQuery.data,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error("Erro ao listar pagamentos manuais da barbearia:", error);
    return res.status(500).json({ message: "Erro interno ao listar pagamentos manuais." });
  }
};

/**
 * PATCH /api/reservas/pagamento-manual/:bookingPaymentId/declarar-pago
 *
 * Cliente declara que realizou o pagamento manual por fora (envio do Pix).
 * Altera status do pagamento e da reserva para manual_review.
 */
export const declararPagamentoManual = async (req: Request, res: Response) => {
  try {
    const { id: userId } = getUserInfo(req);

    if (!userId) {
      return res.status(401).json({ message: "Não autorizado." });
    }

    const { bookingPaymentId } = req.params;

    const result = await bookingPaymentManualService.reportManualBookingPayment({
      bookingPaymentId,
      userId,
    });

    return res.status(200).json({
      message: "Pagamento declarado com sucesso. Aguardando confirmação do estabelecimento.",
      bookingPayment: {
        id: result.bookingPayment._id,
        status: result.bookingPayment.status,
        amountCents: result.bookingPayment.amountCents,
        currency: result.bookingPayment.currency,
        provider: result.bookingPayment.provider,
      },
      reserva: {
        id: result.reserva._id,
        status: result.reserva.status,
        paymentStatus: result.reserva.paymentStatus,
      },
      paymentStatusPresentation: presentPaymentStatus(result.bookingPayment.status),
      reservaStatusPresentation: presentReservaStatus(result.reserva.status),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error("Erro ao declarar pagamento manual:", error);
    return res.status(500).json({ message: "Erro interno ao declarar pagamento." });
  }
};

