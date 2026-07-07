/**
 * Phase E3 — Manual Payment Integrity Tests
 *
 * Tests for:
 * - P0-A: Cancellation propagates to BookingPayment
 * - P0-B: Block cancel when paymentStatus === "paid"
 * - P0-C: Block confirm/expire when reserva.status === "cancelado"
 */

import { ReservaService } from "../services/reserva.service";
import { BookingPaymentManualService } from "../services/bookingPaymentManual.service";
import { reservaRepository } from "../repositories/reserva.repository";
import { bookingPaymentRepository } from "../repositories/bookingPayment.repository";
import { reservaPolicy } from "../policies/reserva.policy";
import { AppError } from "../errors/AppError";
import mongoose from "mongoose";

// Mock all repositories and policies
jest.mock("../repositories/reserva.repository");
jest.mock("../repositories/bookingPayment.repository");
jest.mock("../policies/reserva.policy");
jest.mock("../models/Barbearia", () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

import Barbearia from "../models/Barbearia";

const reservaService = new ReservaService();
const bookingPaymentManualService = new BookingPaymentManualService();

// Helper to create a mock reserva
function mockReserva(overrides: any = {}) {
  const id = new mongoose.Types.ObjectId();
  return {
    _id: id,
    usuario: new mongoose.Types.ObjectId(),
    barbearia: new mongoose.Types.ObjectId(),
    servico: new mongoose.Types.ObjectId(),
    dataHora: new Date(Date.now() + 86400000), // 24h in future (avoids cancellation policy cutoff)
    status: "pendente",
    paymentStatus: "pending",
    paymentRequired: true,
    bookingPaymentId: new mongoose.Types.ObjectId(),
    criadoEm: new Date(),
    save: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

function mockBookingPayment(overrides: any = {}) {
  const id = new mongoose.Types.ObjectId();
  return {
    _id: id,
    reservaId: new mongoose.Types.ObjectId(),
    barbeariaId: new mongoose.Types.ObjectId(),
    provider: "manual",
    amountCents: 5000,
    currency: "BRL",
    status: "pending",
    expiresAt: new Date(Date.now() + 900000), // 15min in future
    metadataSafe: {},
    ...overrides,
  };
}

describe("Phase E3 — Manual Payment Integrity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reservaPolicy.canCancel as jest.Mock).mockReturnValue(true);
  });

  // =====================================================================
  // P0-A: Cancellation propagates to BookingPayment
  // =====================================================================
  describe("P0-A: Cancel reserva propagates to BookingPayment", () => {
    it("should cancel BookingPayment when cancelling a reserva with pending BookingPayment", async () => {
      const bpId = new mongoose.Types.ObjectId();
      const bp = mockBookingPayment({ _id: bpId, status: "pending" });
      const reserva = mockReserva({
        bookingPaymentId: bpId,
        paymentStatus: "pending",
      });

      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);
      (bookingPaymentRepository.findById as jest.Mock).mockResolvedValue(bp);
      (bookingPaymentRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...bp,
        status: "cancelled",
      });
      (reservaRepository.save as jest.Mock).mockImplementation((r: any) => r);

      const result = await reservaService.cancelarReserva(
        reserva._id.toString(),
        reserva.usuario.toString(),
        "cliente"
      );

      // Verify BookingPayment was updated to cancelled
      expect(bookingPaymentRepository.updateStatus).toHaveBeenCalledWith(
        bpId.toString(),
        "cancelled",
        expect.objectContaining({
          metadataSafe: expect.objectContaining({
            cancelReason: expect.any(String),
          }),
        })
      );

      // Verify reserva paymentStatus was updated
      expect(result.paymentStatus).toBe("cancelled");
      expect(result.status).toBe("cancelado");
    });

    it("should NOT update BookingPayment if it is already paid", async () => {
      const bpId = new mongoose.Types.ObjectId();
      const bp = mockBookingPayment({ _id: bpId, status: "paid" });
      const reserva = mockReserva({
        bookingPaymentId: bpId,
        paymentStatus: "pending", // Not "paid" on the reserva side
      });

      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);
      (bookingPaymentRepository.findById as jest.Mock).mockResolvedValue(bp);
      (reservaRepository.save as jest.Mock).mockImplementation((r: any) => r);

      const result = await reservaService.cancelarReserva(
        reserva._id.toString(),
        reserva.usuario.toString(),
        "cliente"
      );

      // Should NOT call updateStatus because BP is paid
      expect(bookingPaymentRepository.updateStatus).not.toHaveBeenCalled();
      // But paymentStatus on reserva should still reflect cancellation
      expect(result.paymentStatus).toBe("cancelled");
    });
  });

  // =====================================================================
  // P0-B: Block cancel when paymentStatus === "paid"
  // =====================================================================
  describe("P0-B: Block cancel for paid reservas", () => {
    it("should throw ALREADY_PAID_CANCEL when paymentStatus is 'paid'", async () => {
      const reserva = mockReserva({ paymentStatus: "paid" });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);

      await expect(
        reservaService.cancelarReserva(
          reserva._id.toString(),
          reserva.usuario.toString(),
          "cliente"
        )
      ).rejects.toThrow(AppError);

      try {
        await reservaService.cancelarReserva(
          reserva._id.toString(),
          reserva.usuario.toString(),
          "cliente"
        );
      } catch (e: any) {
        expect(e.code).toBe("ALREADY_PAID_CANCEL");
      }
    });

    it("should throw ALREADY_PAID_CANCEL when paymentStatus is 'aprovado' (legacy)", async () => {
      const reserva = mockReserva({ paymentStatus: "aprovado" });
      (reservaRepository.findById as jest.Mock).mockResolvedValue(reserva);

      await expect(
        reservaService.cancelarReserva(
          reserva._id.toString(),
          reserva.usuario.toString(),
          "cliente"
        )
      ).rejects.toThrow(AppError);
    });
  });

  // =====================================================================
  // P0-C: Block confirm/expire when reserva is cancelled
  // =====================================================================
  describe("P0-C: Block confirm/expire on cancelled reserva", () => {
    it("should throw RESERVA_CANCELLED when confirming payment on cancelled reserva", async () => {
      const bpId = new mongoose.Types.ObjectId();
      const barbeariaId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId().toString();
      const bp = mockBookingPayment({
        _id: bpId,
        barbeariaId,
        status: "pending",
        expiresAt: new Date(Date.now() + 900000),
      });
      const reserva = mockReserva({
        status: "cancelado",
        paymentRequired: true,
        bookingPaymentId: bpId,
      });

      (bookingPaymentRepository.findById as jest.Mock).mockResolvedValue(bp);
      (Barbearia.findById as jest.Mock).mockResolvedValue({
        _id: barbeariaId,
        barbeiro: new mongoose.Types.ObjectId(userId),
      });
      (reservaRepository.findByIdRaw as jest.Mock).mockResolvedValue(reserva);

      await expect(
        bookingPaymentManualService.confirmManualBookingPayment({
          bookingPaymentId: bpId.toString(),
          userId,
          userTipo: "barbeiro",
        })
      ).rejects.toThrow(AppError);

      try {
        await bookingPaymentManualService.confirmManualBookingPayment({
          bookingPaymentId: bpId.toString(),
          userId,
          userTipo: "barbeiro",
        });
      } catch (e: any) {
        expect(e.code).toBe("RESERVA_CANCELLED");
      }
    });

    it("should throw RESERVA_CANCELLED when expiring payment on cancelled reserva", async () => {
      const bpId = new mongoose.Types.ObjectId();
      const barbeariaId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId().toString();
      const bp = mockBookingPayment({
        _id: bpId,
        barbeariaId,
        status: "pending",
        expiresAt: new Date(Date.now() - 60000), // Past = overdue
      });
      const reserva = mockReserva({
        status: "cancelado",
        paymentRequired: true,
        bookingPaymentId: bpId,
      });

      (bookingPaymentRepository.findById as jest.Mock).mockResolvedValue(bp);
      (Barbearia.findById as jest.Mock).mockResolvedValue({
        _id: barbeariaId,
        barbeiro: new mongoose.Types.ObjectId(userId),
      });
      (reservaRepository.findByIdRaw as jest.Mock).mockResolvedValue(reserva);

      await expect(
        bookingPaymentManualService.expireOverdueManualBookingPayment({
          bookingPaymentId: bpId.toString(),
          userId,
          userTipo: "barbeiro",
        })
      ).rejects.toThrow(AppError);

      try {
        await bookingPaymentManualService.expireOverdueManualBookingPayment({
          bookingPaymentId: bpId.toString(),
          userId,
          userTipo: "barbeiro",
        });
      } catch (e: any) {
        expect(e.code).toBe("RESERVA_CANCELLED");
      }
    });
  });
});
